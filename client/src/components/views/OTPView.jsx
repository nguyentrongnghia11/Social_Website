"use client"

import { Button, Container, Stack, TextField, Typography, Link, Alert, Snackbar } from "@mui/material"
import { Box } from "@mui/system"
import { useState, useRef, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Copyright from "../Copyright"
import ErrorAlert from "../ErrorAlert"
import { verify, signup } from "../../api-axios/user"

const OTPView = () => {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState("")
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const location = useLocation()

  const userRef = useRef(location.state?.user)

  console.log("user ref ", userRef)

  // State cho 6 ô input OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef([])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  // Xử lý thay đổi input OTP
  const handleOTPChange = (index, value) => {
    // Chỉ cho phép nhập số
    if (value && !/^\d+$/.test(value)) return

    const newOtp = [...otp]
    
    if (value === '') {
      // Xóa giá trị
      newOtp[index] = ''
      setOtp(newOtp)
    } else {
      // Nếu ô hiện tại đã có giá trị và đang nhập giá trị mới
      // Chỉ lấy ký tự cuối cùng
      const newChar = value.charAt(value.length - 1)
      
      // Chỉ update nếu giá trị thực sự thay đổi
      if (newChar !== otp[index]) {
        newOtp[index] = newChar
        setOtp(newOtp)
        
        // Chỉ focus sang ô tiếp theo nếu đang nhập vào ô trống hoặc ghi đè
        if (index < 5 && newChar) {
          // Sử dụng requestAnimationFrame để đảm bảo DOM đã update
          requestAnimationFrame(() => {
            const nextInput = inputRefs.current[index + 1]
            if (nextInput) {
              nextInput.focus()
              // Clear selection để tránh ghi đè không mong muốn
              nextInput.setSelectionRange(1, 1)
            }
          })
        }
      }
    }
  }

  // Xử lý khi focus vào input  
  const handleFocus = (index, e) => {
    // Select all sau một chút để tránh conflict với auto-focus
    requestAnimationFrame(() => {
      e.target.select()
    })
  }

  // Xử lý phím backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Xử lý paste
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = [...otp]

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }

    setOtp(newOtp)

    // Focus vào ô cuối cùng có dữ liệu
    const lastIndex = Math.min(pastedData.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  // Xử lý submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!userRef.current) {
      setServerError("Information incorrect !")
      return
    }
    const otpCode = otp.join("")

    if (otpCode.length !== 6) {
      setServerError("Vui lòng nhập đầy đủ 6 chữ số")
      return
    }
    const user = userRef.current

    const u = { ...user, otpCode, role: "user" }

    setLoading(true)
    // setServerError("useLocation")

    console.log("user ", u)

    try {
      const respone = await verify(u)

      if (respone.status === 200) {
        setSnackbar({ 
          open: true, 
          message: 'Đăng ký thành công! Chuyển đến trang đăng nhập...', 
          severity: 'success' 
        })
        setTimeout(() => {
          navigate("/login")
        }, 2000)
      } else {
        setServerError("Mã OTP không đúng")
      }
    } catch (error) {
      setServerError("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setLoading(false)
    }
  }
  // Gửi lại mã OTP
  const handleResendOTP = async () => {
    setLoading(true)
    setServerError("")
    setCanResend(false)
    setCountdown(60)

    try {
      if (!userRef.current) {
        setServerError("Thông tin người dùng không hợp lệ")
        return
      }

      const data = await signup(userRef.current)

      if (data.status === 200) {
        setSnackbar({ 
          open: true, 
          message: 'Mã OTP mới đã được gửi!', 
          severity: 'success' 
        })
      } else {
        setServerError(data.message || "Không thể gửi lại mã OTP")
      }
    } catch (error) {
      setServerError("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setLoading(false)
    }
  }
  return (
    <Container maxWidth="xs" sx={{ mt: { xs: 2, md: 6 } }}>
      <Stack alignItems="center" spacing={3}>
        <Typography variant="h2" color="text.secondary" sx={{ mb: 2 }}>
          <Link to="/" color="inherit" underline="none">
            MindShare
          </Link>
        </Typography>

        <Typography variant="h5" gutterBottom>
          Xác thực OTP
        </Typography>

        <Typography color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
          Vui lòng nhập mã OTP 6 chữ số đã được gửi đến email của bạn
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          {/* OTP Input Fields */}
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
            {otp.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => handleFocus(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                type="tel"
                autoComplete="off"
                inputProps={{
                  maxLength: 1,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  autoComplete: "off",
                  style: {
                    textAlign: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                  },
                }}
                sx={{
                  width: "50px",
                  "& .MuiOutlinedInput-root": {
                    height: "60px",
                    "& fieldset": {
                      borderColor: digit ? "primary.main" : "rgba(0, 0, 0, 0.6)",
                      borderWidth: 2,
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
                variant="outlined"
              />
            ))}
          </Stack>

          <ErrorAlert error={serverError} />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || otp.join("").length !== 6}
            sx={{ my: 2, py: 1.5 }}
          >
            {loading ? "Đang xác thực..." : "Xác thực"}
          </Button>

          {/* Resend OTP */}
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Không nhận được mã?
            </Typography>
            {canResend ? (
              <Button variant="text" onClick={handleResendOTP} disabled={loading} sx={{ minWidth: "auto", p: 0 }}>
                Gửi lại
              </Button>
            ) : (
              <Typography variant="body2" color="primary.main">
                Gửi lại sau {countdown}s
              </Typography>
            )}
          </Stack>

          {/* Back to login */}
          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Button variant="text" onClick={() => navigate("/login")} sx={{ minWidth: "auto" }}>
              ← Quay lại đăng nhập
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Copyright />
        </Box>
      </Stack>

      {/* Snackbar for success notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default OTPView
