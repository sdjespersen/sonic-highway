// Handles Netlify Identity links (invites, password resets, email confirmation)
// so band members can set a password before logging in to the editor at /admin/.
import { handleAuthCallback, acceptInvite, updateUser, AuthError } from '@netlify/identity'

function openDialog(title, text, withPassword) {
  const dialog = document.createElement('dialog')
  dialog.className = 'account-dialog'
  dialog.innerHTML = `
    <h2></h2>
    <p class="account-dialog__text"></p>
    ${withPassword ? `
    <form>
      <label class="field"><span>New password</span>
        <input type="password" name="password" minlength="8" required autocomplete="new-password">
      </label>
      <button class="btn" type="submit">Save password</button>
      <p class="form__status" role="status" aria-live="polite"></p>
    </form>` : `<a class="btn" href="/admin/">Open the editor</a>`}`
  dialog.querySelector('h2').textContent = title
  dialog.querySelector('.account-dialog__text').textContent = text
  document.body.appendChild(dialog)
  dialog.showModal()
  return dialog
}

function passwordFlow(title, text, save) {
  const dialog = openDialog(title, text, true)
  const form = dialog.querySelector('form')
  const status = dialog.querySelector('.form__status')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    status.textContent = ''
    try {
      await save(form.password.value)
      dialog.close()
      openDialog('All set', 'Your password is saved. Log in to the editor with your email and this password.', false)
    } catch (error) {
      status.textContent = error instanceof AuthError ? error.message : 'Something went wrong. Please try again.'
    }
  })
}

async function run() {
  try {
    const result = await handleAuthCallback()
    if (!result) return
    history.replaceState(null, '', location.pathname)

    switch (result.type) {
      case 'invite':
        passwordFlow('Welcome to the band', 'Choose a password to finish setting up your editor account.', (pw) =>
          acceptInvite(result.token, pw),
        )
        break
      case 'recovery':
        passwordFlow('Reset password', 'Choose a new password for your editor account.', (pw) =>
          updateUser({ password: pw }),
        )
        break
      default:
        openDialog('Email confirmed', 'Your account is ready. Log in to the editor with your email and password.', false)
    }
  } catch (error) {
    openDialog('Link problem', error instanceof AuthError ? error.message : 'This link is invalid or has expired.', false)
  }
}

run()
