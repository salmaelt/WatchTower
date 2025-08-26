import React from 'react'

import ".LoginForm.css"

function Loginform() {
  return (
      <section className="signup-page">
          <h1>Login</h1>
          <form>
              <div>
                  <label htmlFor="email">Email:</label>
                  <input type="email" id="email" name="email" required />
              </div>
              <div>
                  <label htmlFor="password">Password:</label>
                  <input type="password" id="password" name="password" required />
              </div>
              <button type="submit">Login</button>
          </form>
    </section>
  )
}

export default Loginform