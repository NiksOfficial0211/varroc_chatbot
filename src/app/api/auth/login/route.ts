import { NextResponse } from 'next/server';
import pool from '../../../../../utils/db';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }
  let connection ;
  try {
    // Parse raw JSON body
    connection = await pool.getConnection();
    const body = await request.json();
    const { email, password } = body;

    // Check for missing fields
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required',status:0 }, { status: 200 });
    }

    // Query database for user with matching email
    // const [rows]: any = await pool.query('SELECT * FROM auth WHERE username = ?', [email]);
    
    const [rows]: any = await connection.execute(
      // 'SELECT * FROM auth WHERE username = ? AND password = MD5(?)',
      'SELECT * FROM auth WHERE username = ? AND password = ?',
      [email, password]
    );
    

    if (rows.length === 0) {
      return NextResponse.json({ message: 'User not found' ,status:0}, { status: 200 });
    }
    await connection.execute(
      'UPDATE auth SET is_login = 1 WHERE username = ?',
      [email]
    );
    const user = rows[0];

    // Replace this with a hashed password check (bcrypt) in real use cases
    // if (user.password !== password) {
    //   return NextResponse.json({ message: 'Invalid credentials',status:0 }, { status: 200 });
    // }

    // Success: return user info (don't include password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ status:1,success: true,message:"Login successfull", user: userWithoutPassword });

  } catch (err) {
    console.error('DB Error:', err);
    return NextResponse.json({ message: 'Internal Server Error',error:err,status:0}, { status: 500 });
  }finally{
    if (connection) connection.release();
  }
}
