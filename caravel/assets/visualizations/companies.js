var $ = window.$ || require('jquery');

function companiesWidget(slice) {

  function refresh() {
    $('#code').attr('rows', '15');
    $.getJSON(slice.jsonEndpoint(), function (payload) {
        var companiesData = payload.data.atokaData.map(function(data) {
          var website = ''
            , lastRevenue = ''
            , isStarred = ''
            , social = ' '
            , atokaLink = '<a target="_blank" href="' + data.atokaUrl + '">' + data.name + '</a>'
            , liStyle = 'margin-bottom: 12px;border-bottom: 1px dashed gainsboro;';

          if (data.website !== '-') {
              website = '<a target="_blank" href="' + data.website + '"><i class="fa fa-globe" aria-hidden="true"></i> Sito web</a>'
          }

          if (data.lastRevenue !== '-') {
            lastRevenue = '<br/> Ultimi ricavi ' + data.lastRevenue + ' (' + data.lastYear + ')';
          }

          if (data.isStarred) {
            isStarred = '<i title="' + payload.data.starredLabel + '" class="fa fa-star-o" aria-hidden="true"></i> ';
          }

          if (data.facebook) {
            social += '<a target="_blank" href="' + data.facebook + '"><i class="fa fa-facebook-f" aria-hidden="true"></i> Facebook</a> ';
          }

          if (data.linkedin) {
            social += '<a target="_blank" href="' + data.linkedin + '"><i class="fa fa-linkedin" aria-hidden="true"></i> Linkedin</a>';
          }

          return '<li style="' + liStyle + '">' + isStarred + atokaLink + lastRevenue + '<br/>' + website + social +'</li>';
        });
        slice.container.html('<ul style="list-style:none;padding:15px;padding-bottom:20px;">' + companiesData.join('') + '</ul>');
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
