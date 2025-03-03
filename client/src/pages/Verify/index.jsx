import { useEffect, useState } from 'react';
import styles from './Verify.module.scss'
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import instance from '~/Fetch/instance';

const cx = classNames.bind(styles);


function Verify() {
    const handleVerify = async (otp) => {
        const data = await instance.post("/api/ytopic/auth/v1/local/verify", {
            "account": sessionStorage.getItem("account"),
            "password": sessionStorage.getItem("password"),
            "otp": otp
        })

        if (data.status === 200) {
            console.log("Success")
            navigate('/')
        }
        else {
            console.log("Fail")
        }
    }

    const navigate = useNavigate()

    const [state, setState] = useState([])

    useEffect(() => {
        if (state.length === 6 && state.every((item) => item !== undefined)) {

            let o = Number(state.join(''));
            console.log(o)
            console.log(sessionStorage.getItem("otp"))
            if (o === Number(sessionStorage.getItem("otp"))) {

                //handleVerify(o)
                console.log("Otp match")

                handleVerify(o)



                return;
            }
            else {
                console.log("Otp not match")
                setState([])
                console.log('day la stay', state)



            }
        }
    })



    useEffect(() => {
        console.log('use eff')

        const inputs = document.querySelectorAll(`.${cx("otp-input")}`);



        inputs.forEach(element => {

            element.addEventListener('change', (e) => {



                let index = Array.from(inputs).indexOf(element);
                let value = e.target.value;
                setState((prevState) => {
                    const newState = [...prevState]; // Tạo bản sao mới của mảng state
                    newState[index] = value; // Gán giá trị vào vị trí index
                    console.log(newState)
                    return newState; // Trả về state mới
                });
            })
        });

    }, [])

    return (
        <>
            <div className={cx("wrapper")}>
                <input type="number" className={cx("otp-input")} maxLength="1" tabIndex={0} />
                <input type="number" className={cx("otp-input")} maxLength="1" tabIndex={0} />
                <input type="number" className={cx("otp-input")} maxLength="1" tabIndex={0} />
                <input type="number" className={cx("otp-input")} maxLength="1" tabIndex={0} />
                <input type="number" className={cx("otp-input")} maxLength="1" tabIndex={0} />
                <input type="number" className={cx("otp-input")} maxLength="1" tabIndex={0} />
            </div>
        </>
    )
}

export default Verify;