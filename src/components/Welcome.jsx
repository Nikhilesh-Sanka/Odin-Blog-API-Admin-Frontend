import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

export function Welcome(props) {
  return (
    <div className="welcome">
      <h1>Welcome !!!!</h1>
      <p>
        <Link to="/sign-up">sign up</Link>/<Link to="/login">login</Link>
      </p>
    </div>
  );
}

export function SignUp() {
  const form = useRef(null);
  const [errors, setErrors] = useState([]);
  const [fetchingStatus, steFetchingStatus] = useState("not-initiated");
  const { setUserToken } = useOutletContext();
  const navigate = useNavigate();
  async function handleSubmit(e) {
    e.preventDefault();
    let username = form.current.childNodes[0].childNodes[2];
    let password = form.current.childNodes[1].childNodes[2];
    let confirmPassword = form.current.childNodes[2].childNodes[2];
    let adminCode = form.current.childNodes[3].childNodes[2];
    if (username.value.trim() == "") {
      username.setCustomValidity("username cannot be empty");
      username.reportValidity();
      return;
    }
    if (password.value.trim() === "") {
      password.setCustomValidity("password cannot be empty");
      password.reportValidity();
      return;
    }
    if (password.value !== confirmPassword.value) {
      confirmPassword.setCustomValidity(
        "password and confirm password fields are not matching"
      );
      confirmPassword.reportValidity();
      return;
    }
    steFetchingStatus("initiated");
    const response = await fetch(
      "https://blog-api-odin.adaptable.app/admin/sign-up",
      {
        method: "POST",
        body: JSON.stringify({
          username: username.value,
          password: password.value,
          "admin-code": adminCode.value,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    steFetchingStatus("not initiated");
    if (response.status === 201) {
      const loginResponse = await fetch(
        `https://blog-api-odin.adaptable.app/admin/login?username=${username.value}&password=${password.value}`,
        {
          method: "GET",
        }
      );
      const token = await loginResponse.json();
      localStorage.setItem("user", JSON.stringify(token));
      setUserToken(token);
      navigate("/");
      return;
    }
    const errors = await response.json();
    setErrors(errors);
  }
  return (
    <div className="sign-up">
      <h2>Sign up</h2>
      <form ref={form}>
        <label>
          username:
          <br />
          <input type="text" />
        </label>
        <label>
          password:
          <br />
          <input type="password" />
        </label>
        <label>
          confirm password:
          <br />
          <input type="password" />
        </label>
        <label>
          admin code: <br />
          <input type="password" />
        </label>
        <button onClick={handleSubmit}>sign up</button>
      </form>
      {errors.length !== 0 ? (
        <div className="errors">
          {errors.map((error) => {
            return <p key={error.msg}>{error.msg}</p>;
          })}
        </div>
      ) : null}
      <p className="fetching-status">
        {fetchingStatus === "initiated" ? "...signing up" : null}
      </p>
    </div>
  );
}

export function Login() {
  const form = useRef(null);
  const [fetchingStatus, setFetchingStatus] = useState("not initiated");
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const { setUserToken } = useOutletContext();

  async function handleSubmit(e) {
    e.preventDefault();
    const username = form.current.childNodes[0].childNodes[2];
    const password = form.current.childNodes[1].childNodes[2];
    if (username.value.trim() === "") {
      username.setCustomValidity("username cannot be empty");
      username.reportValidity();
      return;
    }
    if (password.value.trim() === "") {
      password.setCustomValidity("password cannot be empty");
      password.reportValidity();
      return;
    }
    setFetchingStatus("initiated");
    const response = await fetch(
      `https://blog-api-odin.adaptable.app/admin/login?username=${username.value}&password=${password.value}`,
      {
        method: "GET",
      }
    );
    setFetchingStatus("not initiated");
    if (response.status === 403) {
      setErrors(["invalid username or password"]);
      return;
    }
    const token = await response.json();
    localStorage.setItem("user", JSON.stringify(token));
    setUserToken(token);
    navigate("/");
  }
  return (
    <div className="login">
      <h2>Login</h2>
      <form ref={form}>
        <label>
          username: <br />
          <input type="text" />
        </label>
        <label>
          password: <br />
          <input type="password" />
        </label>
        <button onClick={handleSubmit}>submit</button>
      </form>
      {errors.length !== 0 ? (
        <div className="errors">
          <p>{errors[0]}</p>
        </div>
      ) : null}
      <p className="fetching-status">
        {fetchingStatus !== "not initiated" ? "...logging in" : null}
      </p>
    </div>
  );
}
