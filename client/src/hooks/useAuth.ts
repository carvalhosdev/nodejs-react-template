import axios from "axios"
import Cookie from "universal-cookie";
import {useDispatch} from "react-redux"
import {clearUser, setUser} from "../features/userSlice"

const cookie = new Cookie();

const useAuth = () => {
	const dispatch = useDispatch()
	
	const login = async () => {
	
	}
	
	const signup = async () => {
	
	}
	
	const fetchUser = async () => {
		const sessionToken = cookie.get("session_token")
		try{
			const response = await axios.get("https://localhost:8080/auth/me", {
				headers: {
					...(sessionToken) ? {Authorization: `Bearer ${sessionToken}`} : null
				}
			})
			
			const user = response.data;
			if(!user){
				return dispatch(clearUser())
			}
			
			dispatch(setUser({
				email: user.email,
				username: user.username
			}))
			
		}catch (error){
			return dispatch(clearUser())
		}
	}
	
	const logout = () => {
		cookie.remove("session_token")
		return dispatch(clearUser())
	}
	
	return {login, signup, logout, fetchUser}
	
}

export default useAuth