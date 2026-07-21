```
const Avatar = tml! {
    @props {
        user: User
        onUpdate: (user: User) => void
        isLogIn: boolean = false
    }



    <div class="avatar">
        <img src={user.avatar} alt={user.name} />
    </div>
}
```
