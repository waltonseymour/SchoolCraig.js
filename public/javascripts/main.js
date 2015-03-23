(function() {
  "use strict";

  // Stores DOM elements after post has been loaded
  var POST_CACHE = {};

  // global variables
  var globals = {};

  function initializeMap() {
    var mapOptions = {
      center: { lat: globals.latitude, lng: globals.longitude},
      zoom: 14
    };
    globals.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    globals.markers = [];
  }

  function addMarkers(posts){
    _.each(globals.markers, function(marker){
      marker.setMap(null);
    });
    globals.markers = [];
    _.each(posts, function(post){
      var marker = new google.maps.Marker({
        position: { lat: post.latitude, lng: post.longitude},
        map: globals.map,
        animation: google.maps.Animation.DROP
      });
      marker.postID = post.id;
      google.maps.event.addListener(marker, 'mouseover', function(marker) {
        var $post = $("div").find("[data-id='" + this.postID + "']");
        $post.addClass('hover');
      });
      google.maps.event.addListener(marker, 'click', function(marker) {
        var $post = $("div").find("[data-id='" + this.postID + "']");
        $post.trigger('click');
      });
      google.maps.event.addListener(marker, 'mouseout', function(marker) {
        var $post = $("div").find("[data-id='" + this.postID + "']");
        $post.removeClass('hover');
      });
      globals.markers.push(marker);
    });
  }

  (function preload(){
    var urls = [];
    $('.post').each(function(){
      var postID = $(this).attr('data-id');
      var photoID = $(this).attr('data-photo');
      if (photoID) {
        urls.push('/posts/' + postID + '/photos/' + photoID);
      }
    });
    $(urls).each(function(){
      $('<img/>')[0].src = this;
    });
  })();

  // retrieves location on load
  getLocation(function(pos){
    var crd = pos.coords;
    globals.latitude = crd.latitude;
    globals.longitude = crd.longitude;
    getPosts();
    initializeMap();
  });

  function getCurrentOptions(overrides){
    overrides = overrides || {};
    var options = _.defaults(overrides, {
      page: parseInt($('#post-container').attr('data-page')) || 1,
      category: $('#category-filter').val(),
      order: $('input[type=radio][name=order]:checked').val(),
      latitude: globals.latitude,
      longitude: globals.longitude,
      radius: $('input[type=range]').val()
    });
    return options;
  }

  $(document).keydown(function(e) {
      switch(e.which) {
          case 37: changePage(false);
          break;
          case 39: changePage(true);
          break;
          default: return; // exit this handler for other keys
      }
      e.preventDefault(); // prevent the default action (scroll / move caret)
  });

  $('#post-container nav .pager .next, #post-container nav .pager .previous').click(function(event){
    changePage($(event.target).parent().hasClass('next'));
    return false;
  });

  $('body').on('click', '.post', function (event) {
    var id = $(this).attr('data-id');
    if (POST_CACHE[id] === undefined) {
      // retrieves data if needed
      getPost(id);
    }
    else {
      // otherwise pulls from cache
      $('#post-modal')[0].parentNode.replaceChild(POST_CACHE[id], $('#post-modal')[0]);
      $('#post-modal').modal('show');
    }
  });
  $('input[type=radio][name=order]').change(function() {
    // resets page to 1 on ordering change
    getPosts(getCurrentOptions({page: 1}));
  });

  $('input[type=range]').change(function() {
    getPosts(getCurrentOptions());
  });

  $('body').on('click', '.modal', function (event) {
    if(typeof $(event.target).attr('id') != 'undefined'){
      $(event.target).modal('hide');
    }
  });

  $('body').on('click', '.delete', function (event) {
    $('#post-modal').modal('hide');
    var id = $('#post-modal').attr('data-id');
    swal({
      title: "Are you sure?",
      text: "Your post cannot be recovered",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel",
      closeOnConfirm: false,
      closeOnCancel: true
    },
    function(isConfirm){
      if (isConfirm) {
        swal("Deleted!", "Your post has been deleted.", "success");
        $.ajax({
          url: 'posts/' + id,
          type: 'DELETE',
          success: function() {
            ga('send', 'event', 'Posts', 'Delete', id);
            setTimeout(function(){ location.reload(); }, 1000);
            },
          error: function(err) { console.log("delete post failed"); }
        });
      }
      else {
        $('#post-modal').modal('show');
      }
    });
  });

  $('#delete-account').click(function(){
    var id = $('#user-id').val();
    swal({
      title: "Are you sure?",
      text: "Your account cannot be recovered",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      confirmButtonText: "Yes, I understand",
      cancelButtonText: "No, cancel",
      closeOnConfirm: false,
      closeOnCancel: true
    },
    function(isConfirm){
      if (isConfirm) {
        swal("Deleted!", "Your account has been deleted.", "success");
        $.ajax({
          url: 'users/' + id,
          type: 'DELETE',
          success: function() {
            ga('send', 'event', 'User', 'Delete', id);
            setTimeout(function(){ location.reload(); }, 1000);
            },
          error: function(err) { console.log("delete user failed"); }
        });
      }
    });
  });

  $('#create-modal').on('shown.bs.modal', function () {
    $('.create-title').focus();
  });

  $('#category-filter').change(function(event){
    // resets to front page on a category change
    var options = getCurrentOptions({page: 1});
    getPosts(options);
    ga('send', 'event', 'Catgeories', 'Select', $(this).val());
  });

  $('#create-form').parsley({
    successClass: 'success',
    errorClass: 'error'
  });

  $('#create-form').submit(function () {
    var post = {};
    post.id =  uuid.v4();
    post.title = $('#create-form .create-title').val();
    post.description = $('#create-form .create-description').val();
    post.price = $('#create-form .create-price').val();
    post.category_id = $('#create-form select').val();

    post.latitude = globals.latitude;
    post.longitude = globals.longitude;
    createPost(post);
    ga('send', 'event', 'Posts', 'Create', post.id);
    return false;
  });

  $('#search-form').submit(function () {
    var query = $('input[type=search]').val();
    $.ajax({
      url: 'posts/search/' + query,
      type: 'GET',
      success: renderPosts,
      error: function(err) { console.log("get post failed"); }
    });
    ga('send', 'event', 'Posts', 'Search', query);
    return false;
  });

  $('#logout').click(logout);

  function changePage(isNext){
    var options = getCurrentOptions();
    options.page = isNext ? options.page + 1 : options.page - 1;
    if(options.page > 0){
      getPosts(options);
      ga('send', 'event', 'Page', 'Change', options.page.toString());
    }
  }

  function getPost(id) {
    $('#post-modal').attr('data-id', id);
    $.ajax({
      url: 'posts/' + id,
      type: 'GET',
      success: renderPostModal,
      error: function(err) { console.log("get post failed"); }
    });
    ga('send', 'event', 'Posts', 'Open', id);
  }

  function getPosts(options){
    options = options || getCurrentOptions();
    // sets data in the DOM
    $('#post-container').attr('data-page', options.page);
    // Converts to url parameters
    var params = jQuery.param(options);
    $.ajax({
      url: 'posts?' + params,
      type: 'GET',
      success: renderPosts,
      error: function(err) { console.log("get post failed"); }
    });
  }

  function renderPostModal(data) {
    var title = data.title;
    if (data.price > 0) {
      title += " - $" + data.price;
    }
    if (data.user.id === $('#user-id').val()) {
      $('.delete').show();
    }
    else {
      $('.delete').hide();
    }
    $('#post-modal .modal-title').text(title);
    $('#post-modal .modal-body').text(data.description);
    if (data.photos[0]) {
      var url = '/posts/' + data.id + '/photos/' + data.photos[0].id;
      $('#post-modal .modal-image').attr("src", url).show();
    }
    else {
      $('#post-modal .modal-image').hide();
    }

    $('#modal-contact').attr("href", "https://mail.google.com/mail/?view=cm&fs=1&to="+data.user.email+"&su="+data.title);
    POST_CACHE[data.id] = $('#post-modal')[0].cloneNode(true);
    $('#post-modal').modal('show');
  }

  function renderPosts (data) {
    addMarkers(data);
    var posts = new EJS({url: 'templates/posts.ejs'}).render({posts: data});
    var $container  = $('#post-container .posts');
    $container.fadeOut(200, function(){
      $container.html(posts);
      $container.fadeIn(200);
    });
  }

  function createPost(post){
    $.ajax({
      url: 'posts',
      type: 'POST',
      data: post,
      success: function(){
        getSignedUrl(post.id);
      },
      error: function(err) { console.log("create post failed"); }
    });
  }

  function getSignedUrl(postID) {
    var contentType = $('#create-file').val().split('.').pop();
    if (!contentType) {
      location.reload();
      return;
    }
    var MIME = {
      "jpg": 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };
    contentType = MIME[contentType];
    var photo = {contentType: contentType};
    $.ajax({
      url: 'posts/' + postID + '/photos',
      type: 'POST',
      data: photo,
      success: function(url) {
        uploadFile({url: url, contentType: contentType});
      },
      error: function(err) { console.log("get signed url failed"); }
    });
  }

  function uploadFile(options) {
    var file = document.getElementById('create-file').files[0];
    $.ajax({
      xhr: function() {
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener("progress", function(evt) {
          if (evt.lengthComputable) {
            var percentComplete = evt.loaded / evt.total;
            // add in progress bar here
          }
        }, false);
        return xhr;
      },
      url: options.url,
      type: 'PUT',
      data: file,
      contentType: options.contentType,
      processData: false,
      success: function(){
        location.reload();
      },
      error: function(err) { console.log("upload file failed"); }
    });
  }

  function logout(){
    $.ajax({
      url: 'users/deauth',
      type: 'POST',
      success: function() { location.reload(); },
      error: function(err) { console.log("login failed"); }
    });
  }

  function getLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(callback);
    } else {
      // get location from IP
    }
  }

}());
