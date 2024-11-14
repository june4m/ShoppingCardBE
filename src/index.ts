import express from 'express'
import userRouter from './routes/users.routers'
import databaseServices from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediaRouter from './routes/media.router'
import { initForder } from './utils/file'
// console.log(new Date(2004, 6, 4).toISOString())

//dùng express tạo seveer (app)
const app = express()
const PORT = 3000
databaseServices.connect() //kết nối với database
initForder()
app.use(express.json()) //sever dùng midlewares biến đổi các chuỗi json được gửi lên

//sever dùng userRouter
app.use('/users', userRouter)
app.use('/medias', mediaRouter)
//app mở ở port 3000
//localhost:3000/users/get-me
app.use(defaultErrorHandler)
app.listen(PORT, () => {
  console.log(`Server is running on port: ` + PORT)
})
