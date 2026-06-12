import React, { useEffect, useState } from "react";
import "./Login.css";
import Header from "../Header";
import Navbar from "../Navbar";
import Footer from "../Footer";
import API from "../../services/api";
import { FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
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

  // 🔹 FORM VALIDATION STATES
  const [registerErrors, setRegisterErrors] = useState<any>({});
  const [registerTouched, setRegisterTouched] = useState<any>({});
  const [loginErrors, setLoginErrors] = useState<any>({});
  const [loginTouched, setLoginTouched] = useState<any>({});

  // 🔹 VALIDATION HELPER FUNCTIONS
  const validateRegister = (data: any) => {
    const errors: any = {};
    if (!data.full_name || !data.full_name.trim()) {
      errors.full_name = "Please Enter Your Full Name";
    } else if (data.full_name.trim().length < 3) {
      errors.full_name = "Full name must be at least 3 characters";
    }

    if (!data.mobile) {
      errors.mobile = "Please Enter Your Mobile Number";
    } else if (!/^[6-9][0-9]{9}$/.test(data.mobile)) {
      errors.mobile = "Please Enter a Valid 10-digit Mobile Number";
    }

    if (!data.password) {
      errors.password = "Please Enter Your Password";
    } else if (data.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!data.state_id) {
      errors.state_id = "Please Select Your State";
    }

    if (!data.district_id) {
      errors.district_id = "Please Select Your District";
    }

    if (!data.mandal_id) {
      errors.mandal_id = "Please Select Your Mandal";
    }

    if (!data.constituency_id) {
      errors.constituency_id = "Please Select Your Constituency";
    }

    if (!data.village_id) {
      errors.village_id = "Please Select Your Village";
    }

    if (!data.address || !data.address.trim()) {
      errors.address = "Please Enter Your Full Address";
    } else if (data.address.trim().length < 5) {
      errors.address = "Address must be at least 5 characters";
    }

    return errors;
  };

  const validateLogin = (data: any) => {
    const errors: any = {};
    if (!data.mobile) {
      errors.mobile = "Please Enter Your Mobile Number";
    } else if (!/^[6-9][0-9]{9}$/.test(data.mobile)) {
      errors.mobile = "Please Enter a Valid 10-digit Mobile Number";
    }

    if (!data.password) {
      errors.password = "Please Enter Your Password";
    } else if (data.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return errors;
  };

  // Run validation reactively on change
  useEffect(() => {
    setRegisterErrors(validateRegister(registerData));
  }, [registerData]);

  useEffect(() => {
    setLoginErrors(validateLogin(loginData));
  }, [loginData]);



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
    const v = val.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);

    type === "login"
      ? setLoginData({ ...loginData, mobile: v })
      : setRegisterData({ ...registerData, mobile: v });
  };

  // 🔹 LOGIN
  const handleLogin = async () => {
    const touchedAll = { mobile: true, password: true };
    setLoginTouched(touchedAll);

    const errors = validateLogin(loginData);
    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const res = await API.post("/users/login", loginData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user)); // Fixed: Save user profile for frontend access
      toast.success("Login Success");
      window.location.href = "/";
    } catch {
      toast.error("Login failed");
    }
  };

  // 🔹 REGISTER
  const handleRegister = async () => {
    const touchedAll: any = {};
    Object.keys(registerData).forEach((key) => {
      touchedAll[key] = true;
    });
    setRegisterTouched(touchedAll);

    const errors = validateRegister(registerData);
    setRegisterErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      // Call the endpoint to check if mobile already exists
      const res = await API.post("/users/check-mobile", { mobile: registerData.mobile });

      // Some backends might return 200 but say it exists
      if (res.data?.message && res.data.message.toLowerCase().includes("exists")) {
        const errorMsg = res.data.message;
        setRegisterErrors((prev: any) => ({
          ...prev,
          mobile: errorMsg,
        }));
        setRegisterTouched((prev: any) => ({ ...prev, mobile: true }));
        toast.error(errorMsg, { position: "top-right" });
        return;
      }

      // If the backend returns 200, mobile not registred, so open OTP popup
      setOtpPopup(true);
      toast.info("Use OTP: 123456");
    } catch (err: any) {
      console.error("check-mobile error:", err);
      // If the backend returns 400 (user already exists)
      if (err?.response?.status === 400) {
        const errorMsg = err?.response?.data?.message || "User already exists with this mobile number";
        setRegisterErrors((prev: any) => ({
          ...prev,
          mobile: errorMsg,
        }));
        setRegisterTouched((prev: any) => ({ ...prev, mobile: true }));
        toast.error(errorMsg, { position: "top-right" });
      } else {
        // If it's a 404, 500, or network error
        toast.error(err?.response?.data?.message || "Server error while checking mobile");
      }
    }
  };

  // Verify OTP Static
  const verifyOtp = async () => {
    if (otp !== "123456") {
      return toast.error("Invalid OTP");
    }

    try {
      const res = await API.post("/users/register", registerData);

      // Auto-login: Save token and user from registration response
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      toast.success("Registered successfully");

      setOtpPopup(false); // CLOSE OTP FIRST

      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("duplicate")) {
        setOtpPopup(false);
        const errorMsg = msg || "User already exists with this mobile number";
        setRegisterErrors({ ...registerErrors, mobile: errorMsg });
        setRegisterTouched({ ...registerTouched, mobile: true });
        toast.error(errorMsg, { position: "top-right" });
      } else {
        toast.error("Registration failed");
      }
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
      {/* <Header />
      <Navbar /> */}

      <div className="auth-container">

        {/* LOGIN */}
        {tab === "login" && (
          <div className="auth-box">
            <h2>Login</h2>

            <div className="form-field">
              <label className="form-label">Mobile Number</label>
              <div className="input-wrapper">
                <input
                  className={loginTouched.mobile && loginErrors.mobile ? "input-error" : ""}
                  placeholder="Mobile Number"
                  value={loginData.mobile}
                  onChange={(e) => handleMobile(e.target.value, "login")}
                  onBlur={() => setLoginTouched({ ...loginTouched, mobile: true })}
                />
                {loginTouched.mobile && loginErrors.mobile && <FiAlertCircle className="error-icon" />}
              </div>
              {loginTouched.mobile && loginErrors.mobile && (
                <span className="error-text">{loginErrors.mobile}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Password</label>
              <div className="input-wrapper password-field">
                <input
                  className={loginTouched.password && loginErrors.password ? "input-error" : ""}
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  onBlur={() => setLoginTouched({ ...loginTouched, password: true })}
                />
                {/* <span onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </span> */}
                {loginTouched.password && loginErrors.password && <FiAlertCircle className="error-icon" />}
              </div>
              {loginTouched.password && loginErrors.password && (
                <span className="error-text">{loginErrors.password}</span>
              )}
            </div>

            <p className="link" onClick={handleForgot}>
              Forgot Password?
            </p>

            <button onClick={handleLogin}>Login</button>

            <p className="new-user" onClick={() => setTab("register")}>
              New user? Register
            </p>
          </div>
        )}

        {/* REGISTER */}
        {tab === "register" && (
          <div className="auth-box">
            <h2>Register</h2>

            <div className="form-field">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <input
                  className={registerTouched.full_name && registerErrors.full_name ? "input-error" : ""}
                  placeholder="Full Name"
                  value={registerData.full_name || ""}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, full_name: e.target.value })
                  }
                  onBlur={() => setRegisterTouched({ ...registerTouched, full_name: true })}
                />
                {registerTouched.full_name && registerErrors.full_name && <FiAlertCircle className="error-icon" />}
              </div>
              {registerTouched.full_name && registerErrors.full_name && (
                <span className="error-text">{registerErrors.full_name}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Mobile Number</label>
              <div className="input-wrapper">
                <input
                  className={registerTouched.mobile && registerErrors.mobile ? "input-error" : ""}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Mobile Number"
                  value={registerData.mobile || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
                    setRegisterData({
                      ...registerData,
                      mobile: value,
                    });
                  }}
                  onBlur={() => setRegisterTouched({ ...registerTouched, mobile: true })}
                />
                {registerTouched.mobile && registerErrors.mobile && <FiAlertCircle className="error-icon" />}
              </div>
              {registerTouched.mobile && registerErrors.mobile && (
                <span className="error-text">{registerErrors.mobile}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  className={registerTouched.password && registerErrors.password ? "input-error" : ""}
                  placeholder="Password"
                  type="password"
                  value={registerData.password || ""}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, password: e.target.value })
                  }
                  onBlur={() => setRegisterTouched({ ...registerTouched, password: true })}
                />
                {registerTouched.password && registerErrors.password && <FiAlertCircle className="error-icon" />}
              </div>
              {registerTouched.password && registerErrors.password && (
                <span className="error-text">{registerErrors.password}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Select State</label>
              <div className="input-wrapper">
                <select
                  className={registerTouched.state_id && registerErrors.state_id ? "input-error" : ""}
                  value={registerData.state_id || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : "";
                    setRegisterData({
                      ...registerData,
                      state_id: val,
                      district_id: "",
                      mandal_id: "",
                      constituency_id: "",
                      village_id: "",
                    });
                    setDistricts([]);
                    setMandals([]);
                    setConstituencies([]);
                    setVillages([]);
                  }}
                  onBlur={() => setRegisterTouched({ ...registerTouched, state_id: true })}
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {registerTouched.state_id && registerErrors.state_id && <FiAlertCircle className="error-icon select-error-icon" />}
              </div>
              {registerTouched.state_id && registerErrors.state_id && (
                <span className="error-text">{registerErrors.state_id}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Select District</label>
              <div className="input-wrapper">
                <select
                  className={registerTouched.district_id && registerErrors.district_id ? "input-error" : ""}
                  value={registerData.district_id || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : "";
                    setRegisterData({
                      ...registerData,
                      district_id: val,
                      mandal_id: "",
                      constituency_id: "",
                      village_id: "",
                    });
                    setMandals([]);
                    setConstituencies([]);
                    setVillages([]);
                  }}
                  onBlur={() => setRegisterTouched({ ...registerTouched, district_id: true })}
                  disabled={!registerData.state_id}
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {registerTouched.district_id && registerErrors.district_id && <FiAlertCircle className="error-icon select-error-icon" />}
              </div>
              {registerTouched.district_id && registerErrors.district_id && (
                <span className="error-text">{registerErrors.district_id}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Select Mandal</label>
              <div className="input-wrapper">
                <select
                  className={registerTouched.mandal_id && registerErrors.mandal_id ? "input-error" : ""}
                  value={registerData.mandal_id || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : "";
                    setRegisterData({
                      ...registerData,
                      mandal_id: val,
                      constituency_id: "",
                      village_id: "",
                    });
                    setConstituencies([]);
                    setVillages([]);
                  }}
                  onBlur={() => setRegisterTouched({ ...registerTouched, mandal_id: true })}
                  disabled={!registerData.district_id}
                >
                  <option value="">Select Mandal</option>
                  {mandals.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {registerTouched.mandal_id && registerErrors.mandal_id && <FiAlertCircle className="error-icon select-error-icon" />}
              </div>
              {registerTouched.mandal_id && registerErrors.mandal_id && (
                <span className="error-text">{registerErrors.mandal_id}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Select Constituency</label>
              <div className="input-wrapper">
                <select
                  className={registerTouched.constituency_id && registerErrors.constituency_id ? "input-error" : ""}
                  value={registerData.constituency_id || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : "";
                    setRegisterData({
                      ...registerData,
                      constituency_id: val,
                    });
                  }}
                  onBlur={() => setRegisterTouched({ ...registerTouched, constituency_id: true })}
                  disabled={!registerData.mandal_id}
                >
                  <option value="">Select Constituency</option>
                  {constituencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {registerTouched.constituency_id && registerErrors.constituency_id && <FiAlertCircle className="error-icon select-error-icon" />}
              </div>
              {registerTouched.constituency_id && registerErrors.constituency_id && (
                <span className="error-text">{registerErrors.constituency_id}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Select Village</label>
              <div className="input-wrapper">
                <select
                  className={registerTouched.village_id && registerErrors.village_id ? "input-error" : ""}
                  value={registerData.village_id || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : "";
                    setRegisterData({
                      ...registerData,
                      village_id: val,
                    });
                  }}
                  onBlur={() => setRegisterTouched({ ...registerTouched, village_id: true })}
                  disabled={!registerData.mandal_id}
                >
                  <option value="">Select Village</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {registerTouched.village_id && registerErrors.village_id && <FiAlertCircle className="error-icon select-error-icon" />}
              </div>
              {registerTouched.village_id && registerErrors.village_id && (
                <span className="error-text">{registerErrors.village_id}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Full Address</label>
              <div className="input-wrapper">
                <textarea
                  className={registerTouched.address && registerErrors.address ? "input-error" : ""}
                  placeholder="Full Address"
                  value={registerData.address || ""}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, address: e.target.value })
                  }
                  onBlur={() => setRegisterTouched({ ...registerTouched, address: true })}
                />
                {registerTouched.address && registerErrors.address && (
                  <FiAlertCircle className="error-icon" style={{ alignSelf: "flex-start", marginTop: "12px" }} />
                )}
              </div>
              {registerTouched.address && registerErrors.address && (
                <span className="error-text">{registerErrors.address}</span>
              )}
            </div>

            <button onClick={handleRegister}>Register</button>

            <p className="new-user" onClick={() => setTab("login")}>
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

      {/* <Footer /> */}
    </>
  );
};

export default Login;