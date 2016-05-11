var $ = window.$ || require('jquery');

function companiesWidget(slice) {

  function refresh() {
    $('#code').attr('rows', '15');
    $.getJSON(slice.jsonEndpoint(), function (payload) {
        console.log(payload.data.atokaData)
        var companiesData = payload.data.atokaData.map(function(data) {
          return '<li>' + data.name + '</li>';
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
