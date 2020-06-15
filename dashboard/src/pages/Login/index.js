import React from 'react';
import { useHistory } from 'react-router-dom';

import './styles.css'

import logo from '../../logo.svg';

export default function Login() {
  const history = useHistory();

  function handleSubmit (e) {
    e.preventDefault();
    history.push('dashboard')
  }

  return(
    <div id="content-login">
      <img src={logo} alt="BinoBot"/>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Digite seu E-mail..."/>
        <input type="password" placeholder="Digite sua senha..."/>
        <input class="button" type="submit" value="ENTRAR"/>
      </form>
    </div>
  )
}