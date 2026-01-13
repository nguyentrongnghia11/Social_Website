// // ChatContext.js
// export function ChatProvider({ user, children }) {
//     const [lastMessage, setLastMessage] = useState(null)
//     const [notifications, setNotifications] = useState([])

//     useEffect(() => {
//         if (!user) return

//         const handleMessage = (content) => {
//             setLastMessage(content)  // chỉ giữ message mới nhất
//         }

//         const handleNotification = (noti) => {
//             setNotifications((prev) => [noti, ...prev])
//         }

//         socket.on("chat", handleMessage)
//         socket.on("chat-group", handleMessage)
//         socket.on("notification", handleNotification)

//         return () => {
//             socket.off("chat", handleMessage)
//             socket.off("chat-group", handleMessage)
//             socket.off("notification", handleNotification)
//         }
//     }, [user])

//     return (
//         <ChatContext.Provider value={{ lastMessage, notifications }}>
//             {children}
//         </ChatContext.Provider>
//     )
// }
