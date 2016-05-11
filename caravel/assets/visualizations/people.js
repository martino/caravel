var $ = window.$ || require('jquery');

function peopleWidget(slice) {

  function refresh() {
    $('#code').attr('rows', '15');
    $.getJSON(slice.jsonEndpoint(), function (payload) {
        var peopleData = payload.data.atokaData.map(function(data) {
          return '<li>' + data.name + '</li>';
        });
        slice.container.html('<div>people</div><ul>' + peopleData.join('') + '</ul>');
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

module.exports = peopleWidget;
