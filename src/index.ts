import { Tokenize } from './lexer/lexer'

Tokenize(`
@with(props.user.profile) {
  <div>
    <h1>{name}</h1>
    <p>{address.city}</p>
  </div>
}
`)
