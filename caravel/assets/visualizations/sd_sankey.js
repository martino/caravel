// CSS
require('./sd_sankey.css');
// JS
var px = window.px || require('../javascripts/modules/caravel.js');
var d3 = window.d3 || require('d3');
d3.sankey = require('d3-sankey').sankey;

function sankeyVis(slice) {
  var div = d3.select(slice.selector);
  var selectedValues = {};

  var render = function () {
    var margin = {
      top: 5,
      right: 5,
      bottom: 5,
      left: 5
    };
    var width = slice.width() - margin.left - margin.right;
    var height = slice.height() - margin.top - margin.bottom;

    var formatNumber = d3.format(",.2f");

    div.selectAll("*").remove();
    var svg = div.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = div.append("div")
      .attr("class", "sd_sankey-tooltip")
      .style("opacity", 0);

    var sankey = d3.sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .size([width, height]);

    var path = sankey.link();

    d3.json(slice.jsonEndpoint(), function (error, json) {
      if (error !== null) {
        slice.error(error.responseText);
        return '';
      }
      var links = json.data;
      var nodes = {};
      // Compute the distinct nodes from the links.
      links.forEach(function (link) {
        link.source = nodes[link.source] || (nodes[link.source] = { name: link.source });
        link.target = nodes[link.target] || (nodes[link.target] = { name: link.target });
        link.value = Number(link.value);
      });
      nodes = d3.values(nodes);

      sankey
        .nodes(nodes)
        .links(links)
        .layout(32);
      var noSelection = (Object.keys(selectedValues).length == 0);

      var link = svg.append("g").selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", function (d) {
          var baseClass =  "link";
          if (noSelection) {
            return baseClass;
          } else {
            if (selectedValues[json.form_data.groupby[0]].indexOf(d.source.name.replace(json.form_data.source_field_label, "")) != -1
                && selectedValues[json.form_data.groupby[1]].indexOf(d.target.name.replace(json.form_data.target_field_label, "")) != -1) {
              return baseClass + " selected";
            } else {
              return baseClass;
            }
          }
        })
        .attr("d", path)
        .style("stroke-width", function (d) {
          return Math.max(1, d.dy);
        })
        .sort(function (a, b) {
          return b.dy - a.dy;
        })
        .on("mouseover", onmouseover)
        .on("mouseout", onmouseout)
        .on("click", click);

      var node = svg.append("g").selectAll(".node")
        .data(nodes)
       .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
        .call(d3.behavior.drag()
          .origin(function (d) {
            return d;
          })
          .on("dragstart", function () {
            this.parentNode.appendChild(this);
          })
          .on("drag", dragmove));

      node.append("rect")
        .attr("height", function (d) {
          return d.dy;
        })
        .attr("width", sankey.nodeWidth())
        .style("fill", function (d) {
          var name = (typeof d.name === 'string') ? d.name : d.name.toString();

          d.color = px.color.category21(name.replace(/ .*/, ""));
          return d.color;
        })
        .style("stroke", function (d) {
          return d3.rgb(d.color).darker(2);
        })
        .on("mouseover", onmouseover)
        .on("mouseout", onmouseout);

      node.append("text")
        .attr("x", -6)
        .attr("y", function (d) {
          return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) {
          return d.name;
        })
        .filter(function (d) {
          return d.x < width / 2;
        })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

      function dragmove(d) {
        d3.select(this)
          .attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");

        sankey.relayout();
        link.attr("d", path);
      }

      function getTooltipHtml(d) {
        var html;

        if (d.sourceLinks) { // is node
          html = d.name + " Value: <span class='emph'>" + formatNumber(d.value) + "</span>";
        } else {
          var val = formatNumber(d.value);
          var sourcePercent = d3.round((d.value / d.source.value) * 100, 1);
          var targetPercent = d3.round((d.value / d.target.value) * 100, 1);

          html = [
            "<div class=''>Path Value: <span class='emph'>", val, "</span></div>",
            "<div class='percents'>",
              "<span class='emph'>", (isFinite(sourcePercent) ? sourcePercent : "100"), "%</span> of ", d.source.name, "<br/>",
              "<span class='emph'>" + (isFinite(targetPercent) ? targetPercent : "--") + "%</span> of ", d.target.name, "target",
            "</div>"
          ].join("");
        }
        return html;
      }

      function click(d) {
        var sourceValue = d.source.name.replace(json.form_data.source_field_label, "")
          , targetValue = d.target.name.replace(json.form_data.target_field_label, "")
          , sourceField = json.form_data.groupby[0]
          , targetField = json.form_data.groupby[1];

        if (Object.keys(selectedValues).length == 0) {
          // add filter
          selectedValues[sourceField] = [sourceValue];
          selectedValues[targetField] = [targetValue];

          slice.setFilter(sourceField, selectedValues[sourceField], true);
          slice.addFilter(targetField, selectedValues[targetField]);
        } else {
          if (selectedValues[sourceField] != sourceValue || selectedValues[targetField] != targetValue) {
            // remove and add filter
            slice.removeFilter(sourceField, selectedValues[sourceField], true);
            slice.removeFilter(targetField, selectedValues[targetField], true);

            selectedValues = {};
            selectedValues[sourceField] = [sourceValue];
            selectedValues[targetField] = [targetValue];

            slice.setFilter(sourceField, selectedValues[sourceField], true);
            slice.addFilter(targetField, selectedValues[targetField]);
          } else {
            // remove filter
            slice.removeFilter(sourceField, selectedValues[sourceField], true);
            slice.removeFilter(targetField, selectedValues[targetField]);
            selectedValues = {}
          }
        }
      }

      function onmouseover(d) {
        tooltip
          .html(function () { return getTooltipHtml(d); })
         .transition()
          .duration(200)
          .style("left", (d3.event.layerX + 10) + "px")
          .style("top", (d3.event.layerY + 10) + "px")
          .style("opacity", 0.95);
      }

      function onmouseout(d) {
        tooltip.transition()
          .duration(100)
          .style("opacity", 0);
      }

      slice.done(json);
    });
  };
  return {
    render: render,
    resize: render
  };
}

module.exports = sankeyVis;
