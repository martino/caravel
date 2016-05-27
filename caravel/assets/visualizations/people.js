var $ = window.$ || require('jquery');

function peopleWidget(slice) {

  function refresh() {
    $('#code').attr('rows', '15');
    $.getJSON(slice.jsonEndpoint(), function (payload) {
        if (payload.data.atokaData.length == 0) {

        } else {
          var peopleData = payload.data.atokaData.map(function(data) {
            var liStyle = 'margin-bottom: 12px'
              , isStarred = ''
              , atokaLink = '<a target="_blank" href="' + data.atokaUrl + '">' + data.name + '</a>'
              , birthInfo = ''
              , roles = ''
              , residence = '<br/><small>Residente a </small>' + data.municipality +' (' + data.province + ')';

            if (data.age) {
              birthInfo = '(' + data.age + ' anni)' ;
            }

            if (data.roles.length > 0) {
              var all_roles = data.roles.map(function(role) {
                var cxx;

                if (role.isCeo) {
                  cxx = 'CEO';
                } else {
                  cxx = 'CFO';
                }
                return '<li>' + cxx + ' @ <a target="_blank" href="'+ role.atokaUrl+'">' + role.companyName+ '</a></li>'
              });

              roles = '<ul>' + all_roles.join('') + '</ul>';
            }

            if (data.isStarred) {
              isStarred = '<i title="' + payload.data.starredLabel + '" class="fa fa-star-o" aria-hidden="true"></i> ';
            }

            return '<li style="' + liStyle + '">' + isStarred + atokaLink + ' ' + birthInfo + residence + roles + ' </li>';
          });
          slice.container.html('<ul style="list-style:none;padding:15px;">' + peopleData.join('') + '</ul>');

        }

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
