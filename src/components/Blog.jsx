import { useEffect, useState, useContext, useRef } from "react";
import { tokenContext } from "../App.jsx";

export function Blog() {
  const [posts, setPosts] = useState(null);
  const [categories, setCategories] = useState(null);
  const [screenStatus, setScreenStatus] = useState({ status: "posts" });
  const { userToken } = useContext(tokenContext);
  function fetchPostsAndCategories() {
    fetch(`http://localhost:3000/admin/posts`, {
      method: "GET",
      headers: {
        authorization: userToken.token,
      },
    })
      .then((response) => {
        if (response.status === 403) {
          return false;
        }
        return response.json();
      })
      .then((posts) => setPosts(posts));
    fetch(`http://localhost:3000/guest/categories`)
      .then((response) => response.json())
      .then((categories) => setCategories(categories.categories))
      .catch((err) => console.error(err));
  }
  useEffect(fetchPostsAndCategories, [screenStatus]);
  return (
    <div className="blog">
      {posts ? (
        screenStatus.status === "posts" ? (
          <Posts
            categories={categories}
            posts={posts}
            setScreenStatus={setScreenStatus}
          />
        ) : screenStatus.status === "create-post" ? (
          <CreatePost
            categories={categories}
            setScreenStatus={setScreenStatus}
            posts={posts}
          />
        ) : screenStatus.status === "edit-post" ? (
          <EditPost
            postId={screenStatus.postId}
            setScreenStatus={setScreenStatus}
            categories={categories}
            posts={posts}
          />
        ) : null
      ) : null}
    </div>
  );
}

// displaying the posts

function Posts(props) {
  const posts = props.posts;
  function handleCreatePostClick() {
    props.setScreenStatus({ status: "create-post" });
  }
  return (
    <div className="posts">
      <h1>Posts</h1>
      <button onClick={handleCreatePostClick} className="create-post-btn">
        Create post
      </button>
      {posts.map((post) => {
        return (
          <Post
            post={post}
            key={post.id}
            setScreenStatus={props.setScreenStatus}
          />
        );
      })}
    </div>
  );
}

function Post(props) {
  const post = props.post;
  const { userToken } = useContext(tokenContext);
  function editPost(postId) {
    props.setScreenStatus({ status: "edit-post", postId });
  }
  async function handleDelete(e) {
    e.stopPropagation();
    let response = await fetch(`http://localhost:3000/admin/posts/${post.id}`, {
      method: "DELETE",
      headers: {
        authorization: userToken.token,
      },
    });
    props.setScreenStatus({ status: "posts" });
  }
  return (
    <div
      className="post"
      onClick={() => {
        editPost(post.id);
      }}
    >
      <h2>{post.title}</h2>
      <p className="date">date: {post.creationDate.slice(0, 10)}</p>
      <div className="categories">
        {post.categories.map((category) => {
          return (
            <div className="category" key={category.id}>
              <p>{category.name}</p>
            </div>
          );
        })}
      </div>
      <p className="publish-status">
        {post.isPublished ? "Published" : "Not Published"}
      </p>
      <button onClick={handleDelete} className="delete-post-btn">
        delete
      </button>
    </div>
  );
}

// **************** creating a post

function CreatePost(props) {
  const [errors, setErrors] = useState([]);
  const form = useRef(null);
  const { userToken } = useContext(tokenContext);
  async function handleSubmit(e) {
    e.preventDefault();
    let title = form.current.childNodes[0].childNodes[2];
    let content = form.current.childNodes[1].childNodes[2];
    let checkedValues = [];
    let publishStatus;
    for (let node of form.current.childNodes) {
      if (node.className === "checkbox") {
        let checkbox = node.childNodes[0];
        if (checkbox.checked) {
          checkedValues.push(checkbox.value);
        }
      }
      if (node.className === "publish-status") {
        let checkbox = node.childNodes[1];
        publishStatus = checkbox.checked;
      }
      if (node.className === "title") {
        title = node.childNodes[2];
      }
      if (node.className === "content") {
        content = node.childNodes[2];
      }
    }
    if (title.value.trim() === "" || content.value.trim() === "") {
      setErrors(["title and content cannot be empty"]);
      return;
    }
    if (
      props.posts.some(
        (post) =>
          post.title.trim().toLowerCase() === title.value.trim().toLowerCase()
      )
    ) {
      setErrors(["the post with this title already exists"]);
      return;
    }
    if (checkedValues.length === 0) {
      setErrors(["your post should belong to at least one category"]);
      return;
    }
    const response = await fetch("http://localhost:3000/admin/posts", {
      method: "POST",
      body: JSON.stringify({
        title: title.value,
        content: content.value,
        categories: checkedValues,
        "publish-status": publishStatus,
      }),
      headers: {
        "Content-Type": "application/json",
        authorization: userToken.token,
      },
    });
    if (response.status === 201) {
      props.setScreenStatus({ status: "posts" });
      return;
    }
    setErrors(["server error"]);
  }
  return (
    <div className="create-post">
      <button
        onClick={() => {
          props.setScreenStatus({ status: "posts" });
        }}
        className="close-btn"
      >
        close
      </button>
      <h1>Create Post</h1>
      <form action="" ref={form}>
        <label className="title">
          Title:
          <br />
          <textarea></textarea>
        </label>
        <label className="content">
          Content:
          <br />
          <textarea></textarea>
        </label>
        <p className="category-header">Categories</p>
        {props.categories.map((category) => {
          return (
            <label className="checkbox" key={category.id}>
              <input
                type="checkbox"
                value={`${category.id}`}
                className="category"
              />
              {category.name}
            </label>
          );
        })}
        <label className="publish-status">
          Publish:
          <input type="checkbox" />
        </label>
        <button onClick={handleSubmit}>Create Blog</button>
      </form>
      {errors.length !== 0 ? (
        <div className="errors">
          <p>{errors[0]}</p>
        </div>
      ) : null}
    </div>
  );
}

// **************** editing a post

function EditPost(props) {
  const [errors, setErrors] = useState([]);
  const [fields, setFields] = useState({
    title: "",
    content: "",
    checkedValues: [],
    isPublished: false,
  });
  const [commentStatus, setCommentStatus] = useState({});
  const [post, setPost] = useState({});
  const form = useRef(null);
  const { userToken } = useContext(tokenContext);

  // fetching the post

  useEffect(() => {
    console.log("... executing effect");
    fetch(`http://localhost:3000/admin/posts/${props.postId}`, {
      method: "GET",
      headers: {
        authorization: userToken.token,
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((post) => {
        console.log(post);
        let checkedValues = post.categories.map((category) => category.id);
        setFields({
          title: post.title,
          content: post.content,
          checkedValues: checkedValues,
          isPublished: post.isPublished,
        });
        setPost(post);
      });
  }, [commentStatus]);

  // handling submit

  async function handleSubmit(e) {
    e.preventDefault();
    if (fields.title.trim() === "") {
      setErrors(["title cannot be empty"]);
      return;
    }
    if (fields.content.trim() === "") {
      setErrors(["content cannot be empty"]);
      return;
    }
    if (fields.checkedValues.length === 0) {
      setErrors(["every post should have at least one category"]);
      return;
    }
    if (
      props.posts.some(
        (existingPost) =>
          existingPost.title.toLowerCase().trim() ===
            fields.title.trim().toLowerCase() && post.id !== existingPost.id
      )
    ) {
      setErrors(["title already exists"]);
      return;
    }
    const response = await fetch(
      `http://localhost:3000/admin/posts/${post.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: fields.title,
          content: fields.content,
          categories: fields.checkedValues,
          "publish-status": fields.isPublished,
        }),
        headers: {
          "Content-Type": "application/json",
          authorization: userToken.token,
        },
      }
    );
    if (response.status === 201) {
      props.setScreenStatus({ status: "posts" });
      navigate("/");
      return;
    }
    setErrors(["server error"]);
  }

  //deleting comments
  async function deleteComment(commentId) {
    let response = await fetch(
      `http://localhost:3000/admin/comments/${commentId}`,
      {
        method: "DELETE",
        headers: {
          authorization: userToken.token,
        },
      }
    );
    setCommentStatus({ ...commentStatus });
  }

  // updating field values
  function updateFieldValue(field, value) {
    setFields({ ...fields, [field]: value });
  }

  // updating checkbox status
  function updateCheckBoxStatus(e) {
    let checkedValue = parseInt(e.target.value);
    if (
      fields.checkedValues.some((value) => parseInt(value) === checkedValue)
    ) {
      let newCheckedValues = fields.checkedValues.filter(
        (value) => parseInt(value) !== checkedValue
      );
      setFields({ ...fields, checkedValues: newCheckedValues });
      return;
    }
    let newCheckedValues = [...fields.checkedValues];
    newCheckedValues.push(checkedValue);
    setFields({ ...fields, checkedValues: newCheckedValues });
  }

  // updating the publish status

  function updatePublishStatus() {
    let newPublishStatus = fields.isPublished ? false : true;
    setFields({ ...fields, isPublished: newPublishStatus });
  }

  // making the default checks from the stored pos

  if (form.current) {
    for (let node of form.current.childNodes) {
      if (node.className === "checkbox") {
        let checkbox = node.childNodes[0];
        console.log(checkbox);
        if (
          fields.checkedValues.some(
            (checkedValue) =>
              parseInt(checkedValue) === parseInt(checkbox.value)
          )
        ) {
          checkbox.checked = true;
        }
      }
      if (node.className === "publish-status") {
        if (fields.isPublished) {
          node.childNodes[1].checked = true;
        }
      }
    }
  }
  return (
    <div className="edit-post">
      <button
        onClick={() => {
          props.setScreenStatus({ status: "posts" });
        }}
        className="close-btn"
      >
        close
      </button>
      <h1>Edit Post</h1>
      <form action="" ref={form}>
        <label className="title">
          Title:
          <br />
          <textarea
            onChange={(e) => {
              updateFieldValue("title", e.target.value);
            }}
            value={fields.title}
          ></textarea>
        </label>
        <label className="content">
          Content:
          <br />
          <textarea
            onChange={(e) => {
              updateFieldValue("content", e.target.value);
            }}
            value={fields.content}
          >
            {fields.content}
          </textarea>
        </label>
        <p className="category-header">Categories</p>
        {props.categories.map((category) => {
          return (
            <label className="checkbox" key={category.id}>
              <input
                type="checkbox"
                value={`${category.id}`}
                onChange={updateCheckBoxStatus}
              />
              {category.name}
            </label>
          );
        })}
        <label className="publish-status">
          Publish:
          <input type="checkbox" onChange={updatePublishStatus} />
        </label>
        <button onClick={handleSubmit}>Update Blog</button>
      </form>
      {post.comments ? (
        <div className="comments">
          {post.comments.map((comment) => {
            return (
              <div className="comment">
                <p>author:{comment.authorName}</p>
                <p>comment:{comment.comment}</p>
                <button
                  onClick={() => {
                    deleteComment(comment.id);
                  }}
                >
                  delete comment
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
      {errors.length !== 0 ? (
        <div className="errors">
          <p>{errors[0]}</p>
        </div>
      ) : null}
    </div>
  );
}
