import React, { useEffect, useState } from "react";
import "./Login.css";
import Header from "../Header";
import Navbar from "../Navbar";
import Footer from "../Footer";
import API from "../../services/api";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";

const Login = () => {
  const [tab, setTab] = useState<"login" | "register">("login");

  const [showPass, setShowPass] = useState(false);
  const [forgotClosing, setForgotClosing] = useState(false);
  const [otpPopup, setOtpPopup] = useState(false);
  const [forgotPopup, setForgotPopup] = useState(false);
  const [resetPopup, setResetPopup] = useState(false);

  const [otp, setOtp] = useState("");

  const [loginData, setLoginData] = useState({ mobile: "", password: "" });

  const [registerData, setRegisterData] = useState<any>({
    full_name: "",
    mobile: "",
    password: "",
    state_id: "",
    district_id: "",
    mandal_id: "",
    constituency_id: "",
    village_id: "",
    address: "",
  });

  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);



  // 🔹 LOCATION APIs
  useEffect(() => {
    API.get("/locations/states").then(res => setStates(res.data));
  }, []);

  useEffect(() => {
    if (registerData.state_id) {
      API.get(`/locations/districts?state_id=${registerData.state_id}`)
        .then(res => setDistricts(res.data));
    }
  }, [registerData.state_id]);

  useEffect(() => {
    if (registerData.district_id) {
      API.get(`/locations/mandals?district_id=${registerData.district_id}`)
        .then(res => setMandals(res.data));
    }
  }, [registerData.district_id]);

  useEffect(() => {
    if (registerData.mandal_id) {
      API.get(`/locations/constituencies?mandal_id=${registerData.mandal_id}`)
        .then(res => setConstituencies(res.data));

      API.get(`/locations/villages?mandal_id=${registerData.mandal_id}`)
        .then(res => setVillages(res.data));
    }
  }, [registerData.mandal_id]);

  // 🔹 MOBILE VALIDATION
  const handleMobile = (val: string, type: any) => {
    const v = val.replace(/\D/g, "").slice(0, 10);

    type === "login"
      ? setLoginData({ ...loginData, mobile: v })
      : setRegisterData({ ...registerData, mobile: v });
  };

  // 🔹 LOGIN
  const handleLogin = async () => {
    try {
      const res = await API.post("/users/login", loginData);
      localStorage.setItem("token", res.data.token);
      toast.success("Login Success");
      window.location.href = "/";
    } catch {
      toast.error("Login failed");
    }
  };

  // 🔹 REGISTER

  // OTP Handler
  // const handleRegister = async () => {
  //   for (let key in registerData) {
  //     if (!registerData[key]) {
  //       return toast.error("All fields required");
  //     }
  //   }

  //   await API.post("/users/send-otp", { mobile: registerData.mobile });
  //   setOtpPopup(true);
  // };

// Verify OTP
  // const verifyOtp = async () => {
  //   await API.post("/users/verify-otp", {
  //     mobile: registerData.mobile,
  //     otp,
  //   });

  //   await API.post("/users/register", registerData);
  //   toast.success("Registered Successfully");
  //   window.location.href = "/";
  // };


        const handleRegister = () => {
        // validation
        for (let key in registerData) {
          if (!registerData[key]) {
            return toast.error("All fields required");
          }
        }

        if (!/^[0-9]{10}$/.test(registerData.mobile)) {
          return toast.error("Invalid mobile number");
        }

        // open OTP popup
        setOtpPopup(true);
        toast.info("Use OTP: 123456");
      };

  // Verify OTP Static
const verifyOtp = async () => {
  if (otp !== "123456") {
    return toast.error("Invalid OTP");
  }

  try {
    await API.post("/users/register", registerData);

    toast.success("Registered successfully 🎉");

    setOtpPopup(false); // CLOSE OTP FIRST

    setTimeout(() => {
      window.location.href = "/";
    }, 500);

  } catch {
    toast.error("Registration failed");
  }
};

  // 🔹 FORGOT PASSWORD
const handleForgot = () => {
  if (!/^[0-9]{10}$/.test(loginData.mobile)) {
    return toast.error("Enter valid mobile");
  }

  setForgotPopup(true);
  toast.info("Use OTP: 123456");
};

const verifyForgotOtp = () => {
  if (otp !== "123456") {
    return toast.error("Invalid OTP");
  }

  closeForgotPopup(); // animate close

  setTimeout(() => {
    setResetPopup(true); // open next popup AFTER animation
  }, 250);
};

const closeForgotPopup = () => {
  setForgotClosing(true);

  setTimeout(() => {
    setForgotPopup(false);   // remove from DOM AFTER animation
    setForgotClosing(false); // reset
  }, 250); // match CSS animation time
};


const [newPass, setNewPass] = useState("");
const [confirmPass, setConfirmPass] = useState("");

const resetPassword = async () => {
  if (newPass !== confirmPass) {
    return toast.error("Passwords do not match");
  }

  try {
    await API.post("/users/reset-password", {
      mobile: loginData.mobile,
      password: newPass,
    });

    toast.success("Password updated successfully");
    setResetPopup(false);

  } catch {
    toast.error("Reset failed");
  }
};

  return (
    <>
      <Header />
      <Navbar />

      <div className="auth-container">

        {/* LOGIN */}
        {tab === "login" && (
          <div className="auth-box">
            <h2>Login</h2>

            <input
              placeholder="Mobile Number"
              value={loginData.mobile}
              onChange={(e) => handleMobile(e.target.value, "login")}
            />

            <div className="password-field">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
              />
              {/* <span onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </span> */}
            </div>

            <p className="link" onClick={handleForgot}>
              Forgot Password?
            </p>

            <button onClick={handleLogin}>Login</button>

            <p onClick={() => setTab("register")}>
              New user? Register
            </p>
          </div>
        )}

        {/* REGISTER */}
        {tab === "register" && (
          <div className="auth-box">
            <h2>Register</h2>

            <input placeholder="Full Name"
              onChange={(e) =>
                setRegisterData({ ...registerData, full_name: e.target.value })
              }
            />

              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Mobile Number"
                value={registerData.mobile || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setRegisterData({
                    ...registerData,
                    mobile: value,
                  });
                }}
              />

            <input placeholder="Password"
              type="password"
              onChange={(e) =>
                setRegisterData({ ...registerData, password: e.target.value })
              }
            />

            <select onChange={(e) =>
              setRegisterData({ ...registerData, state_id: Number(e.target.value) })
            }>
              <option>Select State</option>
              {states.map((s) => <option value={s.id}>{s.name}</option>)}
            </select>

            <select onChange={(e) =>
              setRegisterData({ ...registerData, district_id: Number(e.target.value) })
            }>
              <option>Select District</option>
              {districts.map((d) => <option value={d.id}>{d.name}</option>)}
            </select>

            <select onChange={(e) =>
              setRegisterData({ ...registerData, mandal_id: Number(e.target.value) })
            }>
              <option>Select Mandal</option>
              {mandals.map((m) => <option value={m.id}>{m.name}</option>)}
            </select>

            <select onChange={(e) =>
              setRegisterData({ ...registerData, constituency_id: Number(e.target.value) })
            }>
              <option>Select Constituency</option>
              {constituencies.map((c) => <option value={c.id}>{c.name}</option>)}
            </select>

            <select onChange={(e) =>
              setRegisterData({ ...registerData, village_id: Number(e.target.value) })
            }>
              <option>Select Village</option>
              {villages.map((v) => <option value={v.id}>{v.name}</option>)}
            </select>

            <textarea placeholder="Full Address"
              onChange={(e) =>
                setRegisterData({ ...registerData, address: e.target.value })
              }
            />

            <button onClick={handleRegister}>Register</button>

            <p onClick={() => setTab("login")}>
              Already have account? Login
            </p>
          </div>
        )}
      </div>

      {/* OTP POPUP */}
      {otpPopup && (
        <div className="popup-overlay" onClick={() => setOtpPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            
            <div className="popup-header">
              <h3>Enter OTP</h3>
              <span className="close-btn" onClick={() => setOtpPopup(false)}>✖</span>
            </div>

            <input
              placeholder="Enter OTP"
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="popup-actions">
              <button className="btn-secondary" onClick={() => setOtpPopup(false)}>
                Cancel
              </button>

              <button className="btn-primary" onClick={verifyOtp}>
                Verify
              </button>
            </div>

          </div>
        </div>
      )}

      {forgotPopup && (
        <div
          className={`popup-overlay ${forgotClosing ? "closing" : ""}`}
          onClick={closeForgotPopup}
        >
          <div
            className={`popup-box ${forgotClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popup-header">
              <h3>Enter OTP</h3>
              <span className="close-btn" onClick={closeForgotPopup}>✖</span>
            </div>

            <input onChange={(e) => setOtp(e.target.value)} />

            <div className="popup-actions">
              <button className="btn-secondary" onClick={closeForgotPopup}>
                Cancel
              </button>

              <button className="btn-primary" onClick={verifyForgotOtp}>
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
      {resetPopup && (
        <div className="popup-overlay" onClick={() => setResetPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            
            <div className="popup-header">
              <h3>Reset Password</h3>
              <span className="close-btn" onClick={() => setResetPopup(false)}>✖</span>
            </div>

            <input
              type="password"
              placeholder="New Password"
              onChange={(e) => setNewPass(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPass(e.target.value)}
            />

            <div className="popup-actions">
              <button className="btn-secondary" onClick={() => setResetPopup(false)}>
                Discard
              </button>

              <button className="btn-primary" onClick={resetPassword}>
                Update Password
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Login;