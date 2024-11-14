import { error } from 'console'
import { Request } from 'express'
import formidable, { Files, File } from 'formidable'
import fs from 'fs' //là  thư viện giúp thao tác với file trong máy tính
import path from 'path'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'

//initForder: hàm này kiểm tra thư mục lưu ảnh có chưa, chưa có thì tạo
export const initForder = () => {
  //chuẩn bị đường dẫn tới thư mục lưu ảnh

  //kiểm tra xem đường dẫn này có dẫn tới đâu không
  //nếu k có nghĩa là chưa có thư mục => cần tạo
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      })
    }
  })
}

//handleUploadSingleImage: là hàm nhận vào req và ép req đi qua lưới lọc của
// formidable để lấy các file
// và minh sẽ chỉ lấy các file nào là ảnh mầ thôi
export const handleUploadImage = async (req: Request) => {
  //tạo lưới lọc
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    maxFileSize: 300 * 1024 * 4, //1 hình thì tối đa 300kb
    keepExtensions: true, //giữ lại đuôi của file
    filter: ({ name, originalFilename, mimetype }) => {
      //name: name | key được truyền vào trong <input name = 'blalbal'>
      //orginalFilnamee: tên gốc của file
      //mimetype: định dangj kiểu của type
      //      console.log(name, originalFilename, mimetype)
      //file gửi file trong field có name là img và kiểu file img

      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      //mimetype? nếu là string thì check, k thì thôi
      //ép Boolean luôn, nếu k thì valid sẽ là boolean | undefined

      //nếu sai valid thì dùng form.emit để gữi lỗi
      if (!valid) {
        form.emit('error' as any, new Error('File type not valid') as any)
        //as any vì bug này formidable chưa fix, khi nào hết thì bỏ as any
      }
      //nếu đúng thì return valid
      return valid
    }
  })
  //form.parse về thành promise
  //files là object có dạng giống hình test code cuối cùng

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      if (!files.image) {
        return reject(new Error('Image is empty'))
      }
      return resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  //tạo lưới lọc
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    maxFileSize: 1024 * 1024 * 50, //1 video tối đa 50mb
    keepExtensions: true, //giữ lại đuôi của file
    filter: ({ name, originalFilename, mimetype }) => {
      //name: name | key được truyền vào trong <input name = 'blalbal'>
      //orginalFilnamee: tên gốc của file
      //mimetype: định dangj kiểu của type
      //      console.log(name, originalFilename, mimetype)
      //file gửi file trong field có name là img và kiểu file img

      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      //mimetype? nếu là string thì check, k thì thôi
      //ép Boolean luôn, nếu k thì valid sẽ là boolean | undefined

      //nếu sai valid thì dùng form.emit để gữi lỗi
      if (!valid) {
        form.emit('error' as any, new Error('File type not valid') as any)
        //as any vì bug này formidable chưa fix, khi nào hết thì bỏ as any
      }
      //nếu đúng thì return valid
      return valid
    }
  })
  //form.parse về thành promise
  //files là object có dạng giống hình test code cuối cùng

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      if (!files.video) {
        return reject(new Error('Video is empty'))
      }
      return resolve(files.video as File[])
    })
  })
}

//hàm tiện ích, nhận vào filename: assdasd.png
// lấy asdasd bỏ .png đếau này thêm .jpeg
export const getNameFromFullNameFile = (filename: string) => {
  const nameArr = filename.split('.')
  nameArr.pop() // bỏ cuối
  return nameArr.join('-')
}

export const getExtension = (filename: string) => {
  const nameArr = filename.split('.')
  return nameArr.pop() //pop là xóa và trả ra phần tử bị xóa (phần tử cuối)
}
