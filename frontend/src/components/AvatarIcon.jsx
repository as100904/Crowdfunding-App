import React, { useContext, useEffect, useState } from "react";
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, User, DropdownSection} from "@nextui-org/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Logout from "./Logout";
import { UserContext } from "../App";

export default function AvatarIcon() {
    const {state , dispatch} = useContext(UserContext)
    const navigate = useNavigate()
    const [user , setUser] = useState({})
   useEffect(() => {
        axios.get('http://localhost:5000/currentUser' , {withCredentials: true})
            .then((res) => {
                if(res.data){
                  setUser(res.data);
                  console.log(res.data)  
                }     
            })
            .catch((e)=>{console.log(e)})
   },[]) 

  return (
    <div className="flex items-center gap-4">
      <Dropdown placement="bottom-start">
        <DropdownTrigger>
          <User
            as="button"
            avatarProps={{
              isBordered: true,
              src: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
            }}
            className="transition-transform"
            description={user.email}
            name={user.name}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="User Actions" variant="flat">
          <DropdownSection showDivider>
            <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-bold">Signed in as</p>
                <p className="font-bold">{user.name}</p>
            </DropdownItem>
          </DropdownSection>

          <DropdownItem key="profile" onPress={() => {navigate('/profile')}}>Show Profile</DropdownItem>
          <DropdownItem 
            key="logout" 
            color="danger" 
            onPress={() => {
                Logout();
                navigate('/')
                dispatch({type: "USER" , payload: false })
                }}
            >
            Log Out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
