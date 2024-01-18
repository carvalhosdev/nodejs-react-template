import {useSelector} from "react-redux";
import {RootState} from "../app/store";
import {Navigate, Outlet} from "react-router-dom";

const PrivateRoutes = () => {
	const {user, isLoading} = useSelector((state: RootState) => state.user.value)
	if(isLoading) return <div>Loading...</div>
	return user ? <Outlet /> : <Navigate to="/" />
}
export default PrivateRoutes