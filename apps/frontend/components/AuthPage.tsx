
export function AuthPage (signIn:{signIn:boolean}){
    return <>
    <div className="w-screen h-screen flex justify-center items-center">

        <div>
            <input type="text" placeholder="email" className="pt-2 bg-white"/>
        </div>
        <div>
            <input type="text" placeholder="password"/>
        </div>
        <div>
            <button className="bg-red-50 p-2" onClick={()=>{
                console.log('redirect to some rotue')
            }}>
                {
                    signIn ? 'Sign In' : 'Sign Up'
                }

            </button>
        </div>
    </div>
    </>
}