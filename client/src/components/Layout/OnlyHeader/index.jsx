import Header from "../DefaultLayout/Header";
import styles from './OnlyHeader.module.scss'
import classNames from "classnames/bind";
import Footer from "../DefaultLayout/Footer";
const cx = classNames.bind(styles);


function OnlyHeader({ children }) {

    return (
        <>
            <Header></Header>
            <div className={cx("container")}>
                {children}
            </div>
            <Footer></Footer>
        </>
    )

}

export default OnlyHeader;