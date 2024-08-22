import styles from "./header.module.css";
function Header({ user, login, logout, createMatch, joinMatch, matchStarted }) {
  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <h1>STONE, SCROLL, SHEARS</h1>
        </div>
        <div className={styles.right}>
          {user ? (
            <>
              {!matchStarted ? (
                <>
                  <button onClick={createMatch}>Create Match</button>
                  <button onClick={joinMatch}>Join Match</button>
                </>
              ) : (
                <></>
              )}

              <button className={styles.userInfo}>Account</button>
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
