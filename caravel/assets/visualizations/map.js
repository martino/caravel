var $ = window.$ || require('jquery'),
  console = window.console;

function mapWidget(slice) {
  var dataLayer = null
    , widgetMap = null;
  function refresh() {
    $('#code').attr('rows', '15');
    $.getJSON(slice.jsonEndpoint(), function (payload) {
      var isHeatmap = payload.data.mapType === 'heatmap'
        , mapName = 'cartodbmap'
        , remoteQuery = "SELECT " + payload.data.sqlSelect + " FROM " + payload.data.sqlTable + " " + payload.data.sqlWhere
        , basicTorque = {
          "type": "torque",
          "order": 1,
          "options": {
            "stat_tag": "6bde6ac6-167c-11e6-b4fb-0242ac1100ab",
            "maps_api_template": "http://mapviz.spaziodati.eu:80/user/{user}",
            "sql_api_template": "http://mapviz.spaziodati.eu:80/user/{user}",
            "tiler_protocol": "http",
            "tiler_domain": "mapviz.spaziodati.eu",
            "tiler_port": "80",
            "sql_api_protocol": "http",
            "sql_api_domain": "mapviz.spaziodati.eu",
            "sql_api_endpoint": "/api/v2/sql",
            "sql_api_port": 80,
            "layer_name": "more_comapnies",
            "query": remoteQuery,
            "visible": true,
            "table_name": "more_comapnies",
            "user_name": "spaziodati",
            "tile_style": "/** torque_heat visualization */\n\nMap {\n-torque-frame-count:1;\n-torque-animation-duration:10;\n-torque-time-attribute:\"cartodb_id\";\n-torque-aggregation-function:\"count(cartodb_id)\";\n-torque-resolution:8;\n-torque-data-aggregation:linear;\n}\n\n#more_comapnies{\n  image-filters: colorize-alpha(blue, cyan, lightgreen, yellow , orange, red);\n  marker-file: url(http://s3.amazonaws.com/com.cartodb.assets.static/alphamarker.png);\n  marker-fill-opacity: 0.4*[value];\n  marker-width: 35;\n}\n#more_comapnies[frame-offset=1] {\n marker-width:37;\n marker-fill-opacity:0.2; \n}\n#more_comapnies[frame-offset=2] {\n marker-width:39;\n marker-fill-opacity:0.1; \n}"
          }
        }
        , basicViz = {
          user_name: 'spaziodati',
          maps_api_template: "http://mapviz.spaziodati.eu:80/user/{user}",
          sql_api_template: "http://mapviz.spaziodati.eu:80/user/{user}",
          tiler_protocol: "http",
          tiler_domain: "mapviz.spaziodati.eu",
          tiler_port: "80",
          sql_api_protocol: "http",
          sql_api_domain: "mapviz.spaziodati.eu",
          sql_api_endpoint: "/api/v2/sql",
          sql_api_port: 80,
          type: 'cartodb',
          sublayers: [
            {
              sql: remoteQuery,
              cartocss: '/** choropleth visualization */\n\n#more_comapnies{\n  marker-fill-opacity: 0.8;\n  marker-line-color: #FFF;\n  marker-line-width: 1;\n  marker-line-opacity: 1;\n  marker-width: 10;\n  marker-fill: #91003F;\n  marker-allow-overlap: true;\n}\n#more_comapnies [ pg_revenue <= 1732656000] {\n   marker-fill: #F1EEF6;\n}\n#more_comapnies [ pg_revenue <= 10146000] {\n   marker-fill: #D4B9DA;\n}\n#more_comapnies [ pg_revenue <= 2767000] {\n   marker-fill: #C994C7;\n}\n#more_comapnies [ pg_revenue <= 1366000] {\n   marker-fill: #DF65B0;\n}\n#more_comapnies [ pg_revenue <= 743000] {\n   marker-fill: #E7298A;\n}\n#more_comapnies [ pg_revenue <= 348000] {\n   marker-fill: #CE1256;\n}\n#more_comapnies [ pg_revenue <= 157000] {\n   marker-fill: #91003F;\n}"'
            }
          ]
        };

      if (dataLayer === null) {
        if (isHeatmap) {
          mapName += 'torque';
        }
        slice.container.html('<div id="' + mapName + '" style="min-height: 100%"></div>');

        widgetMap= new L.Map(mapName, {
          center: [45.59049774946348, 9.337692260742188],
          zoom: 8
        });

        L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
          attribution: 'CartoDB'
        }).addTo(widgetMap);

        if (isHeatmap) {
          slice.done(payload);
          cartodb.createLayer(widgetMap, basicTorque)
            .addTo(widgetMap)
            .done(function () {
              slice.done(payload);
            })

        } else {
          cartodb.createLayer(widgetMap, basicViz)
          .addTo(widgetMap)
          .done(function (layer) {
              dataLayer = layer.getSubLayer(0);
              slice.done(payload);
            }
          );
        }
      } else {
        dataLayer.setSQL(remoteQuery);
        slice.done(payload);
      }
    })
    .fail(function (xhr) {
      slice.error(xhr.responseText);
    });
  }

  return {
    render: refresh,
    resize: refresh
  };
}

module.exports = mapWidget;
