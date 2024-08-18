import { GoogleLogin } from "@react-oauth/google";
import styles from "./header.module.css";
import { ReactComponent as Logo } from "../../assets/svgs/stone-scroll-sheers-logo.svg";
function Header({ user, onLoginSuccess, onLogout }) {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Logo width={"100px"} />
          <div>Rock, Paper, Scissors!</div>
        </div>
        <div className={styles.right}>
          <div>Play Game</div>
          <div>
            {user ? (
              <>
                <div>{user.name}</div>
                <button onClick={onLogout}>Logout</button>
              </>
            ) : (
              <GoogleLogin
                onSuccess={onLoginSuccess}
                onError={() => console.log("Login Failed")}
              />
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Header;
