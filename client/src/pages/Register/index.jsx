
import styles from './Register.module.scss'
import classNames from 'classnames/bind'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import instance from '~/Fetch/instance'
import { Button } from 'bootstrap/dist/js/bootstrap.bundle'

const cx = classNames.bind(styles)


function Register() {
    const navigate = useNavigate()

    const handleNext = () => {

        
        const account = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        try {
            instance.post("/api/ytopic/auth/v1/local", {
                account: account,
                password: password,
            }).then((res) => {
                const otp = res.data.otp;
                
                sessionStorage.setItem("otp", otp)
                sessionStorage.setItem("account", account)
                sessionStorage.setItem("password", password)
                navigate('/verify')
            }).catch((err) => {
                console.log(err)
            })
        } catch (error) {

        }
    }
    return (
        <>
            <form className={cx("form")}>
                <div className="">
                    <div className="mb-3">
                        <label htmlFor="exampleFormControlInput1" className="form-label">Email</label>
                        <input type="email" className="form-control" id="email" placeholder="email" tabIndex="0" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="exampleFormControlInput1" className="form-label">Mật Khẩu</label>
                        <input type="email" className="form-control" id="password" placeholder="name@example.com" tabIndex={0} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="exampleFormControlInput1" className="form-label">Nhập Lại Mật Khẩu</label>
                        <input type="email" className="form-control" id="v-password" placeholder="name@example.com" tabIndex={0} />
                    </div>
                    <div className="mb-3" style={{ display: "flex", justifyContent: "center", paddingTop: "20px" }}>
                        <button type="button" className="btn btn-primary" onClick={handleNext} tabIndex={0}>Next</button>
                    </div>
                </div>
            </form>




        </>
    )
}
export default Register;
