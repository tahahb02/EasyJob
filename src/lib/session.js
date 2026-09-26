const KEYS = {
  accessToken: 'easyjob_access_token',
  refreshToken: 'easyjob_refresh_token',
  user: 'easyjob_user',
  loginMessage: 'easyjob_login_message',
}

// La case « Se souvenir de moi » de la page de connexion doit avoir un effet
// réel : les tokens sont écrits dans localStorage (persistants) quand elle est
// cochée, dans sessionStorage (effacés à la fermeture de l'onglet) sinon.
// La lecture accepte les deux emplacements, ce qui évite qu'une session déjà
// ouverte cesse de fonctionner après un changement de réglage.
function read(key) {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value, remember) {
  try {
    const store = remember ? localStorage : sessionStorage
    store.setItem(key, value)
  } catch {
    // Mode navigation privée ou quota : la requête échouera plus tard, mais
    // on ne casse pas le rendu de l'application.
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export const session = {
  get accessToken() {
    return read(KEYS.accessToken)
  },

  get refreshToken() {
    return read(KEYS.refreshToken)
  },

  get user() {
    const raw = read(KEYS.user)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  get loginMessage() {
    const message = read(KEYS.loginMessage)
    remove(KEYS.loginMessage)
    return message
  },

  save({ accessToken, refreshToken, user }, remember = true) {
    remove(KEYS.accessToken)
    remove(KEYS.refreshToken)
    remove(KEYS.user)
    write(KEYS.accessToken, accessToken, remember)
    write(KEYS.refreshToken, refreshToken, remember)
    write(KEYS.user, JSON.stringify(user), remember)
  },

  updateUser(user, remember = true) {
    write(KEYS.user, JSON.stringify(user), remember)
  },

  setLoginMessage(message, remember = true) {
    write(KEYS.loginMessage, message, remember)
  },

  clear() {
    remove(KEYS.accessToken)
    remove(KEYS.refreshToken)
    remove(KEYS.user)
    remove(KEYS.loginMessage)
  },
}
