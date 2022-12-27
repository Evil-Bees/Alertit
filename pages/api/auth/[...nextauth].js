import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "../../../src/helper/mongodb";
import database from "../../../src/helper/database";
import User from "../../../src/models/user";
import { compare } from "bcrypt";
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
	providers: [
		CredentialsProvider({
			id: "credentials",
			name: "Credentials",
			credentials: {
				email: {
					label: "Email",
					type: "text",
				},
				password: {
					label: "Password",
					type: "password",
				},
			},
			async authorize(credentials) {
				await database();
				const user = await User.findOne({
					email:
						credentials === null || credentials === void 0
							? void 0
							: credentials.email,
				});

				if (!user) {
					throw new Error("Email is not registered");
				}

				const isPasswordCorrect = await compare(
					credentials.password,
					user.password
				);

				if (!isPasswordCorrect) {
					throw new Error("Password is incorrect");
				}

				return user;
			},
		}),
		GoogleProvider({
			clientId:process.env.GOOGLE_CLIENT_ID,
			clientSecret:process.env.GOOGLE_CLIENT_SECRET,
		}),
	],
	pages: {
		signIn: "/signin",
	},
	debug: process.env.NODE_ENV === "development",
	adapter: MongoDBAdapter(clientPromise),
	session: {
		strategy: "jwt",
	},
	jwt: {
		secret: process.env.NEXTAUTH_JWT_SECRET,
	},
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async jwt({ token, user }) {
			return { ...token, ...user };
		},
		async session({ session, user, token }) {
			return token;
		},
	},
});

