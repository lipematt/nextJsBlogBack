import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
// import ShortUniqueId from 'short-unique-id';

const prisma = new PrismaClient({
    log: ['query'],
})

async function bootstrap() {
  const app = fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  })

  app.get('/api/get/posts', async (request, reply) => {
    const posts = await prisma.posts.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        images: true,
      },
    });
  
    return { posts: posts };
  });

  app.get('/api/get/users', async (request, reply) => {
    
    const users = await prisma.users.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    
    return { users: users };
  });

    
  app.post('/api/create/post', async (request, reply) => {

    const createPostBody = z.object({
      header: z.string(),
      authorId: z.string(),
      body: z.string(),
      images: z.array(
        z.object({
          name: z.string(),
          width: z.number(),
          height: z.number(),
        })
      ),
    });

    try {
      const { header, authorId, body, images } = createPostBody.parse(
        request.body
      );
  
      const createdPost = await prisma.posts.create({
        data: {
          header,
          authorId,
          body,
          images: {
            create: images,
          },
        },
        include: {
          images: true,
        },
      });
  
      return reply.status(201).send({ createdPost });
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  app.get('/api/get/post/:postId', async (request, reply) => {
    const { postId } = request.params;

    try {
      const post = await prisma.posts.findUnique({
        where: {
          id: postId,
        },
        include: {
          images: true,
        },
      });

      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      return { post };
    } catch (error) {
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  try {
    await app.listen({
      port: 3333,
      // host: '0.0.0.0',
    });
    app.log.info(`Server listening at ${app.server.address().port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();