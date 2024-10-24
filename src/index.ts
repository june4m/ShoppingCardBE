import express from 'express'
import userRouter from './routes/users.routers'
import databaseServices from './services/database.services'

//dùng express tạo seveer (app)
const app = express()
const PORT = 3000
databaseServices.connect() //kết nối với database

app.use(express.json()) //sever dùng midlewares biến đổi các chuỗi json được gửi lên

//sever dùng userRouter
app.use('/users', userRouter)

//app mở ở port 3000
//localhost:3000/users/get-me
app.listen(PORT, () => {
  console.log(`Server is running on port: ` + PORT)
})
