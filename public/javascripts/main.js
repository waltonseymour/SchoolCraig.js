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

  $(function () {
    $('#create-file').fileupload({
      dataType: 'json',
      add: function(e, data){
        if (data.files && data.files[0]) {
          var reader = new FileReader();
          reader.onload = function(e) {
            $('#target').attr('src', e.target.result);
          };
          reader.readAsDataURL(data.files[0]);
          if(!globals.uploadFiles){
            globals.uploadFiles = [];
          }
          globals.uploadFiles.push(data.files[0]);
        }
      }
    });
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

  $(document).ready(function(){
    resizeModal();
  });

  window.onresize = function(event) {
    resizeModal();
  };

  function resizeModal(){
    var vph = $(window).height();
    $('.modal-body').css({'max-height': (vph - 200) + 'px'});
  }

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
    if (price !== "Free"){
      title += ' - ' + price;
    }
    if (data.user.id === $('#user-id').val()) {
      $('.delete').show();
    }
    else {
      $('.delete').hide();
    }
    $('#post-modal .modal-title').text(title);
    $('#post-modal .modal-body .post-description').text(data.description);
    $('#post-modal .modal-thumbnails').html('');
    if (data.photos[0]) {
      var url = '/posts/' + data.id + '/photos/' + data.photos[0].id;
      $('#post-modal .modal-image').attr("src", url).show();
      for (var i = 0; i< data.photos.length; i++) {
        url = '/posts/' + data.id + '/photos/' + data.photos[i].id;
        var img = '<img class="modal-thumbnail" src="'+ url +'">';
        $('#post-modal .modal-thumbnails').append(img);
      }

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
      POST_CACHE[post.id] = post;
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
        getSignedUrls(post.id);
      },
      error: function(err) { console.log("create post failed"); }
    });
  }

  function getSignedUrls(postID) {
    var contentType = globals.uploadFiles[0].type;
    var photos = _.map(globals.uploadFiles, function(file){
      return {contentType: file.type};
    });
    $.ajax({
      url: 'posts/' + postID + '/photos',
      type: 'POST',
      contentType: "application/json",
      data: JSON.stringify(photos),
      success: function(urls) {
        var temp = [];
        for (var i=0; i<urls.length; i++){
          temp.push(_.extend({}, photos[i], {url: urls[i]}));
        }
        uploadFiles(temp);
      },
      error: function(err) { console.log("get signed url failed"); }
    });
  }

  function uploadFiles(photos) {
    var ajaxCalls = [];
    for (var i = 0; i<photos.length; i++){
      var file = globals.uploadFiles[i];
      var deferred = createDeferred(photos[i], file);
      ajaxCalls.push(deferred);
    }
    $.when.apply($, ajaxCalls).then(function(){
      location.reload();
    }).catch(function(error){
      console.log(error);
    });
  }

  function createDeferred(photo, file){
    return $.ajax({
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
      url: photo.url,
      type: 'PUT',
      data: file,
      contentType: photo.contentType,
      processData: false,
      error: function(err) {
        console.log(err);
        console.log("upload file failed"); }
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
