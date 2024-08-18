import styles from "./header.module.css";
import { ReactComponent as Logo } from "../../assets/svgs/stone-scroll-sheers-logo.svg";
function Header({ user, login, logout }) {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Logo width={"100px"} />
          <div>Rock, Paper, Scissors!</div>
        </div>
        <div className={styles.right}>
          <div>Play Game</div>

          {user ? (
            <div className={styles.profile}>
              <div>{user.name}</div>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <button
              className={styles.loginButton}
              onClick={login}
              onError={() => console.log("Login Failed")}
            >
              Log in With Google
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Header;
