var $ = window.$ = require('jquery');
var jQuery = window.jQuery = $;
var px = require('./modules/caravel.js');
var d3 = require('d3');
var showModal = require('./modules/utils.js').showModal;
require('bootstrap');

var ace = require('brace');
require('brace/mode/css');
require('brace/theme/crimson_editor');

require('./caravel-select2.js');
require('../node_modules/gridster/dist/jquery.gridster.min.css');
require('../node_modules/gridster/dist/jquery.gridster.min.js');

require('../stylesheets/dashboard.css');

var getUrlParameterByName = function (name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
};

var Dashboard = function (dashboardData) {
  var dashboard = $.extend(dashboardData, {
    filters: {'default': {}},
    init: function () {
      var urlFilters =  getUrlParameterByName('filters');
      if (urlFilters !== null) {
        this.filters = JSON.parse(urlFilters);

        if (!this.filters.hasOwnProperty('default')) {
          this.filters.default = {};
        }
      }
      this.initDashboardView();
      this.firstLoad = true;
      px.initFavStars();
      var sliceObjects = [],
        dash = this;
      dashboard.slices.forEach(function (data) {
        if (data.error) {
          var html = '<div class="alert alert-danger">' + data.error + '</div>';
          $("#slice_" + data.slice_id).find('.token').html(html);
        } else {
          var slice = px.Slice(data, dash);
          $("#slice_" + data.slice_id).find('a.refresh').click(function () {
            slice.render(true);
          });
          sliceObjects.push(slice);
        }
      });
      this.slices = sliceObjects;
      this.refreshTimer = null;
      this.startPeriodicRender(0);
    },
    getFilterSet: function (filter_set_name) {
      if (!this.filters.hasOwnProperty(filter_set_name)) {
        this.filters[filter_set_name] = {};
      }
      return this.filters[filter_set_name];
    },
    setFilter: function (filter_set_name, slice_id, col, vals, excludeRefresh) {
      this.addFilter(filter_set_name, slice_id, col, vals, false, excludeRefresh);
    },
    addFilter: function (filter_set_name, slice_id, col, vals, merge, excludeRefresh) {
      var filterSet = this.getFilterSet(filter_set_name);
      if (merge === undefined) {
        merge = true;
      }
      if (!(slice_id in filterSet)) {
        filterSet[slice_id] = {};
      }
      if (!(col in filterSet[slice_id]) || !merge) {
        filterSet[slice_id][col] = vals;
      } else {
        filterSet[slice_id][col] = d3.merge([filterSet[slice_id][col], vals]);
      }
      if (!excludeRefresh) {
        // this.refreshExcept(slice_id);
        this.refreshExceptNamespace(filter_set_name);
      }
    },
    readFilters: function () {
      // Returns a list of human readable active filters
      return JSON.stringify(this.filters, null, 4);
    },
    getDashboardUrl: function () {
      return location.origin + location.pathname + encodeURI("?filters=" + JSON.stringify(this.filters));
    },
    stopPeriodicRender: function () {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
    },
    startPeriodicRender: function (interval) {
      this.stopPeriodicRender();
      var dash = this;
      var maxRandomDelay = Math.min(interval * 0.2, 5000);
      var refreshAll = function () {
        dash.slices.forEach(function (slice) {
          var force = !dash.firstLoad;
          setTimeout(function () {
            slice.render(force);
          },
          //Randomize to prevent all widgets refreshing at the same time
          maxRandomDelay * Math.random());
        });
        dash.firstLoad = false;
      };

      var fetchAndRender = function () {
        refreshAll();
        if (interval > 0) {
          dash.refreshTimer = setTimeout(function () {
            fetchAndRender();
          }, interval);
        }
      };
      fetchAndRender();
    },
    refreshExcept: function (slice_id) {
      var immune = this.metadata.filter_immune_slices || [];
      this.slices.forEach(function (slice) {
        if (slice.data.slice_id !== slice_id && immune.indexOf(slice.data.slice_id) === -1) {
          slice.render();
        }
      });
    },
    refreshExceptNamespace: function (namespace) {
      var immune = this.metadata.filter_immune_slices || [];
      this.slices.forEach(function (slice) {
        var sliceNamespace = (slice.data.form_data.filter_set) ? slice.data.form_data.filter_set : 'default';
        if (sliceNamespace === namespace && immune.indexOf(slice.data.slice_id) === -1) {
          slice.render();
        }
      });
    },
    clearFilters: function (filter_set_name, slice_id, excludeRefresh) {
      var filterSet = this.getFilterSet(filter_set_name);
      delete filterSet[slice_id];
      if (!excludeRefresh) {
        // this.refreshExcept(slice_id);
        this.refreshExceptNamespace(filter_set_name);
      }
    },
    removeFilter: function (filter_set_name, slice_id, col, vals, excludeRefresh) {
      var filterSet = this.getFilterSet(filter_set_name);
      if (slice_id in filterSet) {
        if (col in filterSet[slice_id]) {
          var a = [];
          filterSet[slice_id][col].forEach(function (v) {
            if (vals.indexOf(v) < 0) {
              a.push(v);
            }
          });
          filterSet[slice_id][col] = a;
        }
      }
      if (!excludeRefresh) {
        // this.refreshExcept(slice_id);
        this.refreshExceptNamespace(filter_set_name);
      }
    },
    getSlice: function (slice_id) {
      slice_id = parseInt(slice_id, 10);
      for (var i=0; i < this.slices.length; i++) {
        if (this.slices[i].data.slice_id === slice_id) {
          return this.slices[i];
        }
      }
    },
    initDashboardView: function () {
      dashboard = this;
      var gridster = $(".gridster ul").gridster({
        autogrow_cols: true,
        widget_margins: [5, 5],
        widget_base_dimensions: [95, 95],
        draggable: {
          handle: '.drag'
        },
        resize: {
          enabled: true,
          stop: function (e, ui, element) {
            dashboard.getSlice($(element).attr('slice_id')).resize();
          }
        },
        serialize_params: function (_w, wgd) {
          return {
            slice_id: $(_w).attr('slice_id'),
            col: wgd.col,
            row: wgd.row,
            size_x: wgd.size_x,
            size_y: wgd.size_y
          };
        }
      }).data('gridster');

      // Displaying widget controls on hover
      $('.chart-header').hover(
        function () {
          $(this).find('.chart-controls').fadeIn(300);
        },
        function () {
          $(this).find('.chart-controls').fadeOut(300);
        }
      );
      $("div.gridster").css('visibility', 'visible');
      $("#savedash").click(function () {
        var expanded_slices = {};
        $.each($(".slice_info"), function (i, d) {
          var widget = $(this).parents('.widget');
          var slice_description = widget.find('.slice_description');
          if (slice_description.is(":visible")) {
            expanded_slices[$(d).attr('slice_id')] = true;
          }
        });
        var data = {
          positions: gridster.serialize(),
          css: editor.getValue(),
          expanded_slices: expanded_slices
        };
        $.ajax({
          type: "POST",
          url: '/caravel/save_dash/' + dashboard.id + '/',
          data: {
            data: JSON.stringify(data)
          },
          success: function () {
            showModal({
              title: "Success",
              body: "This dashboard was saved successfully."
            });
          },
          error: function (error) {
            showModal({
              title: "Error",
              body: "Sorry, there was an error saving this dashboard:<br />" + error
            });
            console.warn("Save dashboard error", error);
          }
        });
      });

      var editor = ace.edit("dash_css");
      editor.$blockScrolling = Infinity;

      editor.setTheme("ace/theme/crimson_editor");
      editor.setOptions({
        minLines: 16,
        maxLines: Infinity,
        useWorker: false
      });
      editor.getSession().setMode("ace/mode/css");

      $(".select2").select2({
        dropdownAutoWidth: true
      });
      $("#css_template").on("change", function () {
        var css = $(this).find('option:selected').data('css');
        editor.setValue(css);

        $('#dash_css').val(css);
        injectCss("dashboard-template", css);

      });
      $('#filters').click(function () {
        showModal({
          title: "<span class='fa fa-info-circle'></span> Current Global Filters",
          body: "The following global filters are currently applied:<br/>" + dashboard.readFilters()
        });
      });
      $('#share').click(function () {
        showModal({
          title: "<span class='fa fa-info-circle'></span> Share this dashboard with this filters",
          body: "With <a target='_blank' href='" + dashboard.getDashboardUrl() + "'>this link</a> you can share this dashboard with applied filters"
        });
      });
      $("#refresh_dash_interval").on("change", function () {
        var interval = $(this).find('option:selected').val() * 1000;
        dashboard.startPeriodicRender(interval);
      });
      $('#refresh_dash').click(function () {
        dashboard.slices.forEach(function (slice) {
          slice.render(true);
        });
      });
      $("a.remove-chart").click(function () {
        var li = $(this).parents("li");
        gridster.remove_widget(li);
      });

      $("li.widget").click(function (e) {
        var $this = $(this);
        var $target = $(e.target);

        if ($target.hasClass("slice_info")) {
          $this.find(".slice_description").slideToggle(0, function () {
            $this.find('.refresh').click();
          });
        } else if ($target.hasClass("controls-toggle")) {
          $this.find(".chart-controls").toggle();
        }
      });

      editor.on("change", function () {
        var css = editor.getValue();
        $('#dash_css').val(css);
        injectCss("dashboard-template", css);
      });

      var css = $('.dashboard').data('css');
      injectCss("dashboard-template", css);

      // Injects the passed css string into a style sheet with the specified className
      // If a stylesheet doesn't exist with the passed className, one will be injected into <head>
      function injectCss(className, css) {

        var head  = document.head || document.getElementsByTagName('head')[0];
        var style = document.querySelector('.' + className);

        if (!style) {
          if (className.split(' ').length > 1) {
            throw new Error("This method only supports selections with a single class name.");
          }
          style = document.createElement('style');
          style.className = className;
          style.type = 'text/css';
          head.appendChild(style);
        }

        if (style.styleSheet) {
          style.styleSheet.cssText = css;
        } else {
          style.innerHTML = css;
        }
      }
    }
  });
  dashboard.init();
  return dashboard;
};

$(document).ready(function () {
  Dashboard($('.dashboard').data('dashboard'));
  $('[data-toggle="tooltip"]').tooltip({ container: 'body' });
});
