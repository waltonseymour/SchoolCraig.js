"use strict";

$('.post').click(function(event){
  var $this = $(this);
  var id = $this.attr('data-id');
  getPost(id);
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


function getPost(id) {
  $.ajax({
    url: 'posts/' + id,
    type: 'GET',
    success: function(data) { console.log(data); },
    error: function(err) { console.log("create post failed");}
  });
}

function createPost(post){
    $.ajax({
    url: 'posts',
    type: 'POST',
    data: post,
    success: function() { location.reload(); },
    error: function(err) { console.log("create post failed");}
  });
}

function logout(){
  $.ajax({
    url: 'users/deauth',
    type: 'POST',
    success: function() { location.reload(); },
    error: function(err) { console.log("login failed");}
  });
}
