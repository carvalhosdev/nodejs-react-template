import { useRouteError } from "react-router-dom";

export default function ErrorPage(){
	const error = useRouteError()
	return (
		<div>costumize your error</div>
	)
	
}