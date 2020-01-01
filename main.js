var contents, graticule, height, path, projection, svg, width, zoom, zoomable_layer, labels, city_labels, tall_things, tall_things_labels;

var currentLayer = -1;
var baseMapRendered = false;
var labelsRendered = false;

svg = d3.select('svg');

width = 1000;

height = 1000;

zoomable_layer = svg.append('g');

zoom = d3.zoom().scaleExtent([1, 50]).on('zoom', function() {
  var e = d3.event.transform;

  var tx = Math.min(0, Math.max(e.x, width - width * e.k));
  var ty = Math.min(0, Math.max(e.y, height - height * e.k));

  if (e.k > 7) {
    document.querySelector("svg").classList.add("zoomed-in");
  } else {
    document.querySelector("svg").classList.remove("zoomed-in");
  }

  document.querySelector("svg").dataset.zoomLevel = Math.floor(e.k);

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

projection = d3.geoPierceQuincuncial()
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

  var countries, countries_data;
  
  geo_data.objects.ne_50m_admin_0_countries.geometries.sort(function(a,b){
      return a.properties["POP_EST"] - b.properties["POP_EST"]; 
  });
  
  console.log("Countries", geo_data);
  
  countries_data = topojson.feature(geo_data, geo_data.objects.ne_50m_admin_0_countries).features;
  countries = contents.selectAll('.country').data(countries_data);
  countries.enter().append('path').attrs({
    "class": 'country',
    d: path
  }).append("svg:title").text(function(a) { 
    return a.properties.NAME_LONG;
  });
  
  labels = contents.selectAll('.label').data(countries_data);

  baseMapRendered = true;
  currentLayer++;
});

function renderExtraLayers() {
  if (!baseMapRendered) {
    setTimeout(renderExtraLayers, 100);
  } else {
    d3.json("data/earth-lakes-10km.geo.json", function(error, geo_data) {
      if (error) throw error;
    
      console.log("Lakes", geo_data);
    
      contents.append("path")
      .attrs({
        "class": 'lake',
        d: path(geo_data)
      });
    
      currentLayer++;
    });
    
    d3.json("data/earth-rivers-10km.geo.json", function(error, geo_data) {
      if (error) throw error;
    
      console.log("Rivers", geo_data);
    
      contents.append("path")
      .attrs({
        "class": 'river',
        d: path(geo_data)
      });
    
      currentLayer++;
    });
    
    d3.json("data/ne_50m_populated_places_simple.geo.json", function(error, geo_data) {
      if (error) throw error;
    
      var cities;
      
      console.log("Cities", geo_data);

      cities = contents.selectAll('.city').data(geo_data.features);
      cities.enter().append('path').attrs({
        "class": 'city',
        d: path.pointRadius(0.1)
      })
      .append("svg:title").text(function(a, i) { 
        return a.properties.name;
      });

      city_labels = contents.selectAll('.city-label').data(geo_data.features);
    
      currentLayer++;
    });

    d3.json("data/ne_10m_geography_regions_elevation_points.geo.json", function(error, geo_data) {
      if (error) throw error;
    
      var tall_things;
      
      console.log("Tall things", geo_data);

      tall_things = contents.selectAll('.mountain').data(geo_data.features);
      tall_things.enter().append('path').attrs({
        "class": 'mountain',
        d: path.pointRadius(0.1)
      })
      .append("svg:title").text(function(a, i) { 
        return a.properties.name;
      });

      tall_things_labels = contents.selectAll('.mountain-label').data(geo_data.features);
    
      currentLayer++;
    });
  }
}

function renderLabels() {
  if (currentLayer < 4) {
    setTimeout(renderLabels, 100);
  } else {
    var en_labels = labels.enter().append('g').attrs({
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
  
    en_labels.append("image")
      .attr("xlink:href", function(d) {
        if (d.properties.ISO_A2 != '-99') {
          return "flags/4x3/" + d.properties.ISO_A2.toLowerCase() + ".svg";
        }
      })
      .attr("class", "country-flag")
      .attr("width", 10)
      .attr("height", 7.5);
  
    en_labels.append('text')
      .attr("class", "country-name")
      .text(function(d) {
        return d.properties.NAME_LONG;
      });

      var en_city_labels = city_labels.enter().append('g').attrs({
        "class": 'label',
        transform: function(d) {
          var ref, x, y;
          ref = projection(d3.geoCentroid(d)), x = ref[0], y = ref[1];
          return "translate(" + x + "," + y + ")";
        }
      });

      en_city_labels.append('text')
      .attr("class", "city-name")
      .attr("y", 30)
      .text(function(d) {
        return d.properties.name;
      });

      var en_tall_things_labels = tall_things_labels.enter().append('g').attrs({
        "class": 'label',
        transform: function(d) {
          var ref, x, y;
          ref = projection(d3.geoCentroid(d)), x = ref[0], y = ref[1];
          return "translate(" + x + "," + y + ")";
        }
      });

      en_tall_things_labels.append('text')
      .attr("class", "mountain-name")
      .attr("y", 30)
      .text(function(d) {
        return d.properties.name;
      });

      d3.json("data/seas.geo.json", function(error, geo_data) {
        if (error) throw error;
        
        console.log("Seas", geo_data);
  
        sea_labels = contents.selectAll('.sea-label').data(geo_data.features);
  
        var en_sea_labels = sea_labels.enter().append('g').attrs({
          "class": 'label',
          transform: function(d) {
            var ref, x, y;
            ref = projection(d3.geoCentroid(d)), x = ref[0], y = ref[1];
            return "translate(" + x + "," + y + ")";
          }
        });
  
        en_sea_labels.append('text')
        .attr("class", "sea-name")
        .attr("data-magnitude", function(d) {
          return d.properties.magnitude;
        })
        .text(function(d) {
          return d.properties.name;
        });
      });
  }
}

svg.on("mousemove", function() {
  var transform = d3.zoomTransform(this);
  var xy = transform.invert(d3.mouse(this));         
  var pos = projection.invert(xy);

  if (!isNaN(pos[0]) && !isNaN(pos[1])) {
    document.querySelector("#current-pos").innerHTML = pos[1].toFixed(5) + "&deg;, " + pos[0].toFixed(5) + "&deg;";
  } 
});

renderExtraLayers();
renderLabels();