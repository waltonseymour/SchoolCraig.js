(function() {
  "use strict";

  // Stores JSON data for posts
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

    google.maps.event.addListener(globals.map, 'idle', function() {
      var bounds = globals.map.getBounds();
      var center = globals.map.getCenter();
      globals.latitude = center.lat();
      globals.longitude = center.lng();
      var distance = google.maps.geometry.spherical.computeDistanceBetween(bounds.getNorthEast(), bounds.getSouthWest());
      globals.radius = distance*0.000621371192;
      getPosts();
    });
  }

  function addMarkers(posts, initial){
    _.each(globals.markers, function(marker){
      marker.setMap(null);
    });
    globals.markers = [];
    _.each(posts, function(post){
      var marker = new google.maps.Marker({
        position: { lat: post.latitude, lng: post.longitude},
        map: globals.map,
        animation: initial ? google.maps.Animation.DROP : null
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
  },
  function(error){
    console.log(error);
    swal("Oops...", "You must have location enabled to see posts around you", "error");
  });

  function getCurrentOptions(overrides){
    overrides = overrides || {};
    var options = _.defaults(overrides, {
      page: parseInt($('#post-container').attr('data-page')) || 1,
      category: $('#category-filter').val(),
      order: $('input[type=radio][name=order]:checked').val(),
      latitude: globals.latitude,
      longitude: globals.longitude,
      radius: globals.radius || 20
    });
    return options;
  }

  $(document).keydown(function(e) {
    if($("input").is(":focus")){ return; }
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
    getPost($(this).attr('data-id'));
  });
  $('input[type=radio][name=order]').change(function() {
    // resets page to 1 on ordering change
    getPosts(getCurrentOptions({page: 1}));
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
    if(query === ""){
      getPosts();
      return false;
    }
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

  function formatPrice(price){
    if (price > 1000){
      return numeral(price).format('$0a').toUpperCase();
    }
    else if (price > 0){
      return '$' + price;
    }
    else{
      return "Free";
    }
  }

  function changePage(isNext){
    if ($(".no-posts-warning")[0] && isNext){ return; }
    var options = getCurrentOptions();
    options.page = isNext ? options.page + 1 : options.page - 1;
    if(options.page > 0){
      getPosts(options);
      ga('send', 'event', 'Page', 'Change', options.page.toString());
    }
  }

  function getPost(id) {
    $('#post-modal').attr('data-id', id);
    renderPostModal(POST_CACHE[id]);
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
    var price = data.price;
    price = formatPrice(price);
    if (price != "Free"){
      title += ' - ' + price;
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
    $('#post-modal').modal('show');
  }

  function renderPosts (data) {
    var initial = !globals.current_posts;
    if (_.isEqual(globals.current_posts, _.map(data, function(post){return post.id;}))){
      return;
    }
    globals.current_posts = _.map(data, function(post){
      return post.id;
    });
    _.each(data, function(post){
      POST_CACHE[post.id] = _.omit(post, 'id');
    });
    addMarkers(data, initial);
    var temp = _.map(data, function(post){
      post.price = formatPrice(post.price);
      return post;
    });
    var posts = new EJS({url: 'templates/posts.ejs'}).render({posts: temp});
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

  function getLocation(callback, error) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(callback, error);
    } else {
      // handle unsupported browser
    }
  }

}());
