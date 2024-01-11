require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
// const PORT = 900
const PORT = 'https://o-auth-server-kappa.vercel.app'
require("./db/conec")
const session = require("express-session")
const passport = require("passport")
//passport package is use to make connection between google and website
const userdb = require("./model/userSchema")
const OAuth2Strategy = require("passport-google-oauth2").Strategy
const clientid= "1067823704600-1p7b9pe0ekd3s6aavvdg5anievotscre.apps.googleusercontent.com"
const clientsecret = "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"

app.use(cors({
    origin:"https://o-auth-client.vercel.app",
    methods:"GET,POST,PUT,DELETE",
    credentials:true
}))
app.use(express.json())
//it will make a unique id when user will login same as jwt make 
app.use(session({
    secret:"12345abci",
    resave:false,
    saveUninitialized:true,
}))
// Passport is Express-compatible authentication middleware for Node.js.
// Passport's sole purpose is to authenticate requests, which it does through an extensible set of plugins known as strategies
//The API is simple: you provide Passport a request to authenticate, and Passport provides hooks for
// controlling what occurs when authentication succeeds or fails.
app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new OAuth2Strategy({
        clientID:clientid,
        clientSecret:clientsecret,
        
        callbackURL:"/auth/google/callback",
        scope:["profile","email"]
    },
    async(accessToken,refreshToken,profile,done)=>{
        try {
            let user = await userdb.findOne({googleId:profile.id});

            if(!user){
                user = new userdb({
                    googleId:profile.id,
                    displayName:profile.displayName,
                    email:profile.emails[0].value,
                    image:profile.photos[0].value
                });

                await user.save();
            }

            return done(null,user)
        } catch (error) {
            return done(error,null)
        }
    }
    )
)
// app.get('/',(req,resp)=>{
// resp.status(200).json("Server start")
// })
passport.serializeUser((user,done)=>{
done(null,user)
})
passport.deserializeUser((user,done)=>{
done(null,user)
})

//Passport use to attch the profile information to req.user 
/* Passport.serialize and passport.deserialize are used to set id as a cookie in the user's browser and to get the id from 
the cookie when it used to get user info in a callback */



//initialize google auth login
// app.get("/auth/google",passport.authenticate("google",{scope:[
//     "profile","email"
// ]}))
app.get("/auth/googl/callback",passport.authenticate("google",{
    successRedirect:"https://o-auth-client.vercel.app/dashboard",
    failureRedirect:"https://o-auth-client.vercel.app/login"
}))
app.get("/login/sucess",async(req,res)=>{
console.log(req)
    if(req.user){
        res.status(200).json({message:"user Login",user:req.user})
    }else{
        res.status(400).json({message:"Not Authorized"})
    }
})
app.get("/",(req,resp)=>{
    resp.json("Server Running")
})

app.get("/logout",(req,res,next)=>{
    //hover on res.logout function we see message Terminate an existing login session.
    req.logout(function(err){
        if(err){
            
            return next(err)
        }
        res.redirect("https://o-auth-client.vercel.app");
    })
})
app.listen("https://o-auth-server-kappa.vercel.app",()=>{
    console.log(`Server Running on Port ${PORT}`)
})
