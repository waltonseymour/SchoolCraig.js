"use strict";

$('.post').click(function(event){
  var $this = $(this);
  var id = $this.attr('data-id');
});


$('#create-submit').click(function () {
  var post = {};
  post.title = $('#create-form .create-title').val();
  post.description = $('#create-form .create-description').val();
  post.price = $('#create-form .create-price').val();
  post.category_id = $('#create-form select').val();
  createPost(post);
});

$('#logout').click(logout);

function createPost(post){
    $.ajax({
    url: 'posts', // the presigned URL
    type: 'POST',
    data: post,
    success: function() { location.reload(); },
    error: function(err) { console.log("create post failed");}
  });
}

function logout(){
  $.ajax({
    url: 'users/deauth', // the presigned URL
    type: 'POST',
    success: function() { location.reload(); },
    error: function(err) { console.log("login failed");}
  });
}
