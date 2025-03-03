import classNames from 'classnames/bind'
import styles from './Header.module.scss'

import logo from '~/access/image/logo.jpg'

// You can specify which plugins you need
import { Modal } from 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle'
import Tippy from '@tippyjs/react/headless'
import { useState } from 'react'

import instance from '~/Fetch/instance'


const cx = classNames.bind(styles)
function Header(props) {



    const handleLogin = async () => {
        const account = document.getElementById("input-account").value;
        const password = document.getElementById("input-password").value;

        console.log(account, password)

        const data = await instance.post("/api/ytopic/auth/v1/login", {
            account,
            password,
        }, {
            withCredentials: true
        })

        instance.get('/api/ytopic/auth/v1/role', {
            withCredentials: true,
        }).then((res) => {

            console.log('day la role ', res.data.result)
            props.getRole(res.data.result)
        }).catch((err) => {
            console.log(err)
        })


    

        console.log(data)


        if (data.status === 200) {
            console.log("Success")
            document.querySelector(`.${cx("btn-group")}`).style.zIndex = "-1";
            document.querySelector(`.${cx("btn-group")}`).style.visibility = "hidden";

            document.querySelector(`.${cx("infor")}`).style.zIndex = "1";
            document.querySelector(`.${cx("infor")}`).style.visibility = "visible";


            const close = document.getElementById("btn-close");
            close.click();
        }

        else {
            alert("Fail")
        }

    }

    // const [visible, setVisible] = useState([1, 2]);
    const [visible, setVisible] = useState(false);
    const hidden = () => { setVisible(false) }
    const show = () => { setVisible(true) }
    { console.log(styles.wrapper) }
    return (
        <nav className={cx("navbar ", "bg-body-tertiary")}>
            <div className="container-fluid d-flex" >
                <img src={logo} alt="img" style={{ width: "50px", height: "50px", margin: "0px", borderRadius: "50%" }} />



                {/* <Tippy
                    visible={visible.length > 0}
                    render={attrs => (
                        <div className={cx('wrap')}>
                            <div className={cx("proper")} tabIndex="0" {...attrs}>
                                My tippy box
                            </div>
                        </div>
                    )} onClickOutside={hidden}>
                </Tippy> */}

                <div class="input-group  w-25">
                    <input type="text" class="form-control" placeholder="Recipient's username" aria-label="Recipient's username" aria-describedby="button-addon2" />
                    <button class="btn btn-outline-secondary" type="button" id="button-addon2">Tìm Kiếm</button>

                </div>



                <div className={cx("d-grid", "gap-2 d-md-flex justify-content-md-end")}>
                    <div className={cx("btn-group")}>
                        <button className={cx("btn", " btn-primary  ")} data-bs-toggle="modal" data-bs-target="#login" data-bs-whatever="@mdo" style={{ width: "150px" }} type="button" >Đăng Nhập</button>
                        <button className={cx("btn", " btn-danger  ")} data-bs-toggle="modal" data-bs-target="#login" data-bs-whatever="@mdo" style={{ width: "150px" }} type="button" >Đăng Kí</button>
                    </div>

                    <Tippy
                        interactive
                        visible={visible}
                        onClickOutside={() => setVisible(false)}
                        render={(attrs) => (
                            <div className="menu" tabIndex="-1" {...attrs}>
                                <p>Hồ sơ</p>
                                <p>Cài đặt</p>
                                <p>Đăng xuất</p>
                            </div>
                        )}
                    >
                        <div className={cx("infor", "btn")} onClick={() => setVisible(!visible)} tabIndex="0">
                            <div className={cx("circle")}></div>
                        </div>
                    </Tippy>



                </div>





            </div>

            <div className="modal fade" id="login" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Đăng nhập</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="recipient-name" className="col-form-label" >Tài Khoản:</label>
                                    <input type="text" className="form-control" id="input-account" />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="recipient-name" className="col-form-label" >Mật Khẩu:</label>
                                    <input type="text" className="form-control" id="input-password" />
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id='btn-close' data-bs-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-primary" id='btn-login' onClick={handleLogin}>Đăng Nhập</button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>


    )
}

export default Header