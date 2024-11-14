import fs from 'fs' //là  thư viện giúp thao tác với file trong máy tính
import path from 'path'

//initForder: hàm này kiểm tra thư mục lưu ảnh có chưa, chưa có thì tạo
export const initForder = () => {
  //chuẩn bị đường dẫn tới thư mục lưu ảnh
  const uploadsFolderPath = path.resolve('uploads')

  //kiểm tra xem đường dẫn này có dẫn tới đâu không
  //nếu k có nghĩa là chưa có thư mục => cần tạo
  if (!fs.existsSync(uploadsFolderPath)) {
    fs.mkdirSync(uploadsFolderPath, {
      recursive: true
    })
  }
}
