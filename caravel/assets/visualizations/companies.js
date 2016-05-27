var $ = window.$ || require('jquery');

function companiesWidget(slice) {

  function refresh() {
    $('#code').attr('rows', '15');
    $.getJSON(slice.jsonEndpoint(), function (payload) {
        var companiesData = payload.data.atokaData.map(function(data) {
          var website = ''
            , lastRevenue = ''
            , isStarred = ''
            , atokaLink = '<a target="_blank" href="' + data.atokaUrl + '">' + data.name + '</a>'
            , liStyle = 'margin-bottom: 12px';

          if (data.website !== '-') {
              website = '<a target="_blank" href="' + data.website + '">Sito web</a>'
          }

          if (data.lastRevenue !== '-') {
            lastRevenue = 'ultimi ricavi ' + data.lastRevenue + '(' + data.lastYear + ')';
          }

          if (data.isStarred) {
            isStarred = '<i title="' + payload.data.starredLabel + '" class="fa fa-star-o" aria-hidden="true"></i> ';
          }

          return '<li style="' + liStyle + '">' + isStarred + atokaLink + '<br/>' + website + ' ' + lastRevenue + '</li>';
        });
        slice.container.html('<ul style="list-style:none;padding:15px;">' + companiesData.join('') + '</ul>');
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
