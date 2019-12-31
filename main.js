(function() {
  var contents, graticule, height, path, projection, svg, width, zoom, zoomable_layer;

  svg = d3.select('svg');

  width = 1000;

  height = 1000;

  zoomable_layer = svg.append('g');
  
 /*function resize(){
    width = d3.select('.map-container svg').node().getBoundingClientRect().width;
    height = d3.select('.map-container svg').node().getBoundingClientRect().height;
    var svg_g = document.querySelector("svg > g");
    var svg_g_height = svg_g.getBoundingClientRect().height;
     zoomable_layer.attrs({
      transform: [
      "translate(" + [0, 0] + ")",
      "scale(" + height/svg_g_height + ")"
    ].join(" ")});
  }*/

  zoom = d3.zoom().scaleExtent([1, 50]).on('zoom', function() {
    var e = d3.event.transform,
        // now, constrain the x and y components of the translation by the
        // dimensions of the viewport
        tx = Math.min(0, Math.max(e.x, width - width * e.k)),
        ty = Math.min(0, Math.max(e.y, height - height * e.k));
    // then, update the zoom behavior's internal translation, so that
    // it knows how to properly manipulate it on the next movement
    // and finally, update the <g> element's transform attribute with the
    // correct translation and scale (in reverse order)
    zoomable_layer.attrs({
      transform: [
      "translate(" + [tx, ty] + ")",
      "scale(" + e.k + ")"
    ].join(" ")
    });
    return zoomable_layer.selectAll('.label > text').attrs({
      transform: "scale(" + (1 / d3.event.transform.k) + ")"
    });
  });

  svg.call(zoom);
  
  /*window.addEventListener('resize', resize);*/

  projection = d3.geoPierceQuincuncial() // N.B. geoPeirceQuincuncial in 1.1+
    .scale(223.5)
    .translate([width / 2, height / 2])
    .precision(0.1);

  path = d3.geoPath(projection);

  graticule = d3.geoGraticule();

  /*svg.append('defs').append('path').datum(graticule.outline()).attrs({
    id: 'sphere',
    d: path
  });*/
  
  zoomable_layer.append("path")
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    .attr("d", path);
  
  zoomable_layer.append('use').attrs({
    "class": 'sphere_stroke',
    'xlink:href': '#sphere'
  });

  zoomable_layer.append('use').attrs({
    "class": 'sphere_fill',
    'xlink:href': '#sphere'
  });

  contents = zoomable_layer.append('g');

  zoomable_layer.append('path').datum(graticule).attrs({
    "class": 'graticule',
    d: path
  });

 d3.json("data/world-50m.json", function(error, geo_data) {
    if (error) throw error;
    var countries, countries_data, en_labels, labels;
   
   geo_data.objects.ne_50m_admin_0_countries.geometries.sort(function(a,b){
        return a.properties["POP_EST"] - b.properties["POP_EST"]; 
    });
   
   console.log(geo_data);
   
    countries_data = topojson.feature(geo_data, geo_data.objects.ne_50m_admin_0_countries).features;
    countries = contents.selectAll('.country').data(countries_data);
    countries.enter().append('path').attrs({
      "class": 'country',
      d: path
    }).append("svg:title").text(function(a) { 
      return a.properties.NAME_LONG;
    });
   
    labels = contents.selectAll('.label').data(countries_data);
    en_labels = labels.enter().append('g').attrs({
      "class": 'label',
      transform: function(d) {
        var ref, x, y;
        ref = projection(d3.geoCentroid(d)), x = ref[0], y = ref[1];
        return "translate(" + x + "," + y + ")";
      }
    });
    en_labels.classed('no_iso_code', function(d) {
      return d.properties.ISO_A2 === '-99';
    });
    return en_labels.append('text').text(function(d) {
      return d.properties.NAME_LONG;
    });
  });

}).call(this);