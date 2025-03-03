import styles from './Sidebar.module.scss'
import classNames from 'classnames/bind'
import Menu from './Menu/Menu'
import MenuItem from './Menu/MenuItem'

const cx = classNames.bind(styles)

function Sidebar(props) {
    console.log('day la prop ne cu', props.role)

    if (props.role === 'admin') {
        return (
            <Menu>
                <MenuItem pr="Trang chủ" to="/" />
                <MenuItem pr="Bài viết mới" to="/post" />
                <MenuItem pr="Đăng bài viết" to="/create" />
                <MenuItem pr="Quản lý bài viết" to="/manage" />
                <MenuItem pr="Bài viết của bạn" to="/mypost" />
            </Menu>
        )
    }

    return (
        <Menu>
            <MenuItem pr="Trang chủ" to="/" />
            <MenuItem pr="Bài viết mới" to="/post" />
            <MenuItem pr="Đăng bài viết" to="/create" />
            <MenuItem pr="Bài viết của bạn" to="/mypost" />
        </Menu>
    )
}

export default Sidebar