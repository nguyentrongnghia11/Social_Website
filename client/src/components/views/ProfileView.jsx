import { Card, Container, Stack, Tab, Tabs } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import { isLoggedIn } from "../../helpers/authHelper";
import CommentBrowser from "../CommentBrowser";
import { getRandomUser, getUserById } from "../../api-axios/user";

import ErrorAlert from "../ErrorAlert";
import FindUsers from "../FindUsers";
import Footer from "../Footer";
import GoBack from "../GoBack";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import MobileProfile from "../MobileProfile";
import Navbar from "../Navbar";
import PostBrowser from "../PostBrowser";
import Profile from "../Profile";
import ProfileTabs from "../ProfileTabs";

const ProfileView = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("posts");
  const user = isLoggedIn();
  const [error, setError] = useState("");
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUser = async () => {
    setLoading(true);
    setError("");

    console.log('Fetching user with id:', params.id)

    try {
      const data = await getUserById(params.id);
      console.log('Profile API response:', data)

      if (data.error) {
        setError(data.error);
      } else if (data.result) {
        // API trả về: { result: { user, userPosts, likedPosts, commentedPosts } }
        setProfile({
          ...data.result.user,
          userPosts: data.result.userPosts || [],
          likedPosts: data.result.likedPosts || [],
          commentedPosts: data.result.commentedPosts || []
        });
      } else {
        setError("Không tìm thấy người dùng");
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setError("Lỗi khi tải thông tin người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const content = e.target.content.value;
    const name = e.target.title ? e.target.title.value : profile.user.name;

    await updateUser(user, { name, biography: content });

    setProfile({ ...profile, user: { ...profile.user, name, biography: content } });
    setEditing(false);
  };

  const handleEditing = () => {
    setEditing(!editing);
  };

  const handleMessage = () => {
    console.log("profile.user ", profile)
    navigate("/messenger", { state: { user: profile } });
  };

  useEffect(() => {
    fetchUser();
  }, [location]);

  const validate = (content) => {
    let error = "";

    if (content.length > 250) {
      error = "Bio cannot be longer than 250 characters";
    }

    return error;
  };

  let tabs;
  if (profile) {
    tabs = {
      posts: (
        <PostBrowser
          profileUser={profile}
          contentType="posts"
          key="posts"
        />
      ),
      liked: (
        <PostBrowser
          profileUser={profile}
          contentType="liked"
          key="liked"
        />
      ),
      comments: <CommentBrowser profileUser={profile} />,
    };
  }

  return (
    <Container>
      <Navbar />

      <GridLayout
        left={
          <>
            <MobileProfile
              profile={profile}
              editing={editing}
              handleSubmit={handleSubmit}
              handleEditing={handleEditing}
              handleMessage={handleMessage}
              validate={validate}
            />
            <Stack spacing={2}>
              {profile ? (
                <>
                  <ProfileTabs tab={tab} setTab={setTab} />

                  {tabs[tab]}
                </>
              ) : (
                <Loading />
              )}
              {error && <ErrorAlert error={error} />}
            </Stack>
          </>
        }
        right={
          <Stack spacing={2}>
            <Profile
              profile={profile}
              editing={editing}
              handleSubmit={handleSubmit}
              handleEditing={handleEditing}
              handleMessage={handleMessage}
              validate={validate}
            />

            <FindUsers />
            <Footer />
          </Stack>
        }
      />
    </Container>
  );
};

export default ProfileView;
