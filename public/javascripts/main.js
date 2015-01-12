"use strict";

$('body').on('click', '.post', function (event) {
  var $this = $(this);
  var id = $this.attr('data-id');
  getPost(id);
});

$('#category-filter').change(function(event){
  reloadPosts($(this).val());
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
  createPost(post);
  return false;
});

$('#logout').click(logout);

function getPost(id) {
  $.ajax({
    url: 'posts/' + id,
    type: 'GET',
    success: function(data) {
      var title = data.title;
      if (data.price > 0) {
        title += " - $" + data.price;
      }
      $('#post-modal .modal-title').text(title);
      $('#post-modal .modal-body').text(data.description);
      $('#modal-contact').attr("href", "https://mail.google.com/mail/?view=cm&fs=1&to="+data.user.email+"&su="+data.title);
      $('#post-modal').modal('show');
    },
    error: function(err) { console.log("get post failed"); }
  });
}

function reloadPosts (category) {
  $.ajax({
    url: 'posts?category=' + category,
    type: 'GET',
    success: function(data) {
      var posts = new EJS({url: 'templates/posts.ejs'}).render({posts: data});
      var $container  = $('#post-container')
      $container.fadeOut(300, function(){
        $container.html(posts);
        $container.fadeIn(300);
      });
    },
    error: function(err) { console.log("create post failed"); }
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
