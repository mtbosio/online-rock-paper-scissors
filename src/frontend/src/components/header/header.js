import styles from "./header.module.css";
import { ReactComponent as Logo } from "../../assets/svgs/stone-scroll-sheers-logo.svg";
function Header({ user, login, logout, createMatch, joinMatch }) {
  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Logo width={"100px"} />
          <h1>STONE, SCROLL, SHEARS</h1>
        </div>
        <div className={styles.right}>
          {user ? (
            <>
              <button onClick={createMatch}>Create Match</button>
              <button onClick={joinMatch}>Join Match</button>
              <button className={styles.userInfo}>
                <span>{user.given_name}</span>
                <img
                  src={user.picture}
                  alt="Profile"
                  className={styles.profilePicture}
                />
              </button>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <button
              style={{ width: "25%" }}
              onClick={login}
              onError={() => console.log("Login Failed")}
            >
              Log in With Google
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

export default Header;
