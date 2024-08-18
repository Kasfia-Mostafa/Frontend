/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, ChangeEvent } from 'react';
import { toast } from 'sonner';
import useAxiosPublic from '../Hooks/useAxiosPublic';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDispatch, useSelector } from 'react-redux';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { Bookmark, MessageCircle, Send } from 'lucide-react';
import { setPosts, setSelectedPost } from '@/redux/postSlice';
import CommentDialog from './CommentDialog';
import { RootState } from '@/redux/store';

// Define Comment interface
interface Comment {
  _id: string;
  text: string;
  author: string;
}

// Define Author interface
interface Author {
  _id: string;
  username: string;
  profilePicture: string;
}

// Define Post interface
interface Post {
  _id: string;
  author: Author;
  image: string;
  caption: string;
  likes: string[];
  comments: Comment[];
}

interface PostProps {
  post: Post;
}

const Post: React.FC<PostProps> = ({ post }) => {
  const axiosPublic = useAxiosPublic();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Ensure that posts are typed as Post[]
  const posts: Post[] = useSelector((state: RootState) => state.post.posts);

  const [text, setText] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(post.likes.includes(user?._id || ''));
  const [postLike, setPostLike] = useState<number>(post.likes.length);
  const [comment, setComment] = useState<Comment[]>(post.comments);

  console.log('User:', user);

  const changeEventHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const inputText = e.target.value;
    setText(inputText.trim() ? inputText : '');
  };

  const likeOrDislikeHandler = async () => {
    try {
      const action = liked ? 'dislike' : 'like';
      const res = await axiosPublic.get(`/post/${post._id}/${action}`, { withCredentials: true });
      if (res.data.success) {
        const updatedLikes = liked ? postLike - 1 : postLike + 1;
        setPostLike(updatedLikes);
        setLiked(!liked);

        const updatedPostData = posts.map((p) =>
          p._id === post._id
            ? {
                ...p,
                likes: liked ? p.likes.filter((id) => id !== user?._id) : [...p.likes, user!._id],
              }
            : p
        );
        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const commentHandler = async () => {
    try {
      const res = await axiosPublic.post(
        `/post/${post._id}/comment`,
        { text },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        const updatedCommentData = [...comment, res.data.comment];
        setComment(updatedCommentData);

        const updatedPostData = posts.map((p) =>
          p._id === post._id ? { ...p, comments: updatedCommentData } : p
        );

        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message);
        setText('');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deletePostHandler = async () => {
    try {
      const res = await axiosPublic.delete(`/post/delete/${post._id}`, { withCredentials: true });
      if (res.data.success) {
        const updatedPostData = posts.filter((postItem) => postItem._id !== post._id);
        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message);
      }
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  const bookmarkHandler = async () => {
    try {
      const res = await axiosPublic.get(`/post/${post._id}/bookmark`, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className='my-8 w-full max-w-sm mx-auto'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Avatar>
            <AvatarImage src={post.author?.profilePicture} alt='post_image' />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className='flex items-center gap-3'>
            <h1>{post.author?.username}</h1>
            {user?._id === post.author._id && <Badge variant='secondary'>Author</Badge>}
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <MoreHorizontal className='cursor-pointer' />
          </DialogTrigger>
          <DialogContent className='flex flex-col items-center text-sm text-center'>
            {post.author._id !== user?._id && (
              <Button variant='ghost' className='cursor-pointer w-fit text-[#ED4956] font-bold'>
                Unfollow
              </Button>
            )}
            <Button variant='ghost' className='cursor-pointer w-fit'>
              Add to favorites
            </Button>
            {user && user._id === post.author._id && (
              <Button onClick={deletePostHandler} variant='ghost' className='cursor-pointer w-fit'>
                Delete
              </Button>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <img
        className='rounded-sm my-2 w-full aspect-square object-cover'
        src={post.image}
        alt='post_img'
      />

      <div className='flex items-center justify-between my-2'>
        <div className='flex items-center gap-3'>
          {liked ? (
            <FaHeart
              onClick={likeOrDislikeHandler}
              size={24}
              className='cursor-pointer text-red-600'
            />
          ) : (
            <FaRegHeart
              onClick={likeOrDislikeHandler}
              size={22}
              className='cursor-pointer hover:text-gray-600'
            />
          )}

          <MessageCircle
            onClick={() => {
              dispatch(setSelectedPost(post));
              setOpen(true);
            }}
            className='cursor-pointer hover:text-gray-600'
          />
          <Send className='cursor-pointer hover:text-gray-600' />
        </div>
        <Bookmark onClick={bookmarkHandler} className='cursor-pointer hover:text-gray-600' />
      </div>
      <span className='font-medium block mb-2'>{postLike} likes</span>
      <p>
        <span className='font-medium mr-2'>{post.author?.username}</span>
        {post.caption}
      </p>
      {comment.length > 0 && (
        <span
          onClick={() => {
            dispatch(setSelectedPost(post));
            setOpen(true);
          }}
          className='cursor-pointer text-sm text-gray-400'
        >
          View all {comment.length} comments
        </span>
      )}
      <CommentDialog open={open} setOpen={setOpen} />
      <div className='flex items-center justify-between'>
        <input
          type='text'
          placeholder='Add a comment...'
          value={text}
          onChange={changeEventHandler}
          className='outline-none text-sm w-full'
        />
        {text && (
          <span onClick={commentHandler} className='text-[#3BADF8] cursor-pointer'>
            Post
          </span>
        )}
      </div>
    </div>
  );
};

export default Post;
