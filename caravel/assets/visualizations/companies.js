var $ = window.$ || require('jquery');

function companiesWidget(slice) {

  function refresh() {
    $('#code').attr('rows', '15');
    $.getJSON(slice.jsonEndpoint(), function (payload) {
        var companiesData = payload.data.atokaData.map(function(data) {
          var website = ''
            , lastRevenue = ''
            , atokaLink = '<a target="_blank" href="' + data.atokaUrl + '">' + data.name + '</a>';

          if (data.website !== '-') {
              website = '<a target="_blank" href="' + data.website + '">Sito web</a>'
          }

          if (data.lastRevenue !== '-') {
            lastRevenue = 'ultimi ricavi ' + data.lastRevenue + '(' + data.lastYear + ')';
          }

          return '<li>' + atokaLink + '<br/>' + website + ' ' + lastRevenue + '</li>';
        });
        slice.container.html('<div>companies</div><ul>' + companiesData.join('') + '</ul>');
        slice.done();
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

module.exports = companiesWidget;
